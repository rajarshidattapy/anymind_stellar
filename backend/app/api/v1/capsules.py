from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from typing import Optional, List
from app.models.schemas import Capsule, CapsuleCreate, CapsuleUpdate
from app.services.capsule_service import CapsuleService
from app.services.x402_service import (
    is_x402_configured,
    build_402_challenge,
    parse_payment_header,
    verify_and_settle,
)
from app.core.auth_dependencies import get_wallet_address
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[Capsule])
async def list_capsules(wallet_address: Optional[str] = Depends(get_wallet_address)):
    """List all capsules for a user"""
    service = CapsuleService()
    return await service.get_user_capsules(wallet_address)


@router.post("/", response_model=Capsule)
async def create_capsule(capsule: CapsuleCreate, wallet_address: Optional[str] = Depends(get_wallet_address)):
    """Create a new memory capsule"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = CapsuleService()
    return await service.create_capsule(capsule, wallet_address)


@router.get("/{capsule_id}", response_model=Capsule)
async def get_capsule(capsule_id: str):
    """Get a specific capsule"""
    service = CapsuleService()
    capsule = await service.get_capsule(capsule_id)
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")
    return capsule


@router.put("/{capsule_id}", response_model=Capsule)
async def update_capsule(
    capsule_id: str,
    capsule_update: CapsuleUpdate,
    wallet_address: Optional[str] = Depends(get_wallet_address)
):
    """Update capsule metadata"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = CapsuleService()
    capsule = await service.update_capsule(capsule_id, capsule_update, wallet_address)
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found or unauthorized")
    return capsule


@router.delete("/{capsule_id}")
async def delete_capsule(capsule_id: str, wallet_address: Optional[str] = Depends(get_wallet_address)):
    """Delete a capsule"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = CapsuleService()
    await service.delete_capsule(capsule_id, wallet_address)
    return {"success": True, "message": "Capsule deleted"}


@router.post("/{capsule_id}/query")
async def query_capsule(
    capsule_id: str,
    query: dict,
    request: Request,
    wallet_address: Optional[str] = Depends(get_wallet_address)
):
    """
    Query a capsule (requires payment).

    Supports two payment methods:
      1. **Stellar x402** — Send no body payment fields. Server returns 402 with
         a Stellar USDC payment challenge. Client signs auth entries and retries
         with an `X-PAYMENT` header. Zero gas fees (facilitator-sponsored).
      2. **Solana (legacy)** — Include `payment_signature` and `amount_paid` in
         the request body for on-chain SOL verification.
    """
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")

    service = CapsuleService()

    # Fetch capsule to get price
    capsule = await service.get_capsule(capsule_id)
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")

    price_usd = capsule.price_per_query

    # ── x402 Stellar payment flow ──────────────────────────────
    if is_x402_configured() and price_usd > 0:
        payment_header = request.headers.get("X-PAYMENT") or request.headers.get("x-payment")
        has_solana_payment = query.get("payment_signature") and query.get("amount_paid")

        # No payment at all → return 402 challenge
        if not payment_header and not has_solana_payment:
            challenge = build_402_challenge(
                request_url=str(request.url),
                price_usd=price_usd,
                description=f"Query capsule '{capsule.name}' — ${price_usd} USDC per query",
            )
            return JSONResponse(status_code=402, content=challenge)

        # x402 payment present → verify + settle via facilitator
        if payment_header:
            parsed = parse_payment_header(payment_header)
            if not parsed:
                raise HTTPException(status_code=401, detail="Invalid X-PAYMENT header")

            success, payment_ctx, error = await verify_and_settle(
                payment_payload=parsed,
                price_usd=price_usd,
                request_url=str(request.url),
            )

            if not success:
                raise HTTPException(status_code=402, detail=error or "Payment failed")

            # Payment succeeded — record earnings and process query
            logger.info(
                f"x402 payment OK: capsule={capsule_id}, payer={payment_ctx.payer}, tx={payment_ctx.tx_hash}"
            )
            await service._record_earnings(capsule_id, capsule.creator_wallet, price_usd)
            await service._increment_query_count(capsule_id)

            result = {
                "response": f"Query processed for capsule '{capsule.name}'.",
                "capsule_id": capsule_id,
                "price_paid": price_usd,
                "payment_method": "stellar_x402",
                "payment": {
                    "tx_hash": payment_ctx.tx_hash,
                    "network": payment_ctx.network,
                    "payer": payment_ctx.payer,
                    "amount_usdc": payment_ctx.amount_usdc,
                },
            }
            return result

    # ── Legacy Solana payment flow ─────────────────────────────
    try:
        result = await service.query_capsule(
            capsule_id,
            query.get("prompt", ""),
            wallet_address,
            payment_signature=query.get("payment_signature"),
            amount_paid=query.get("amount_paid")
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

