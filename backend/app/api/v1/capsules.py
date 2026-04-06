from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from app.models.schemas import Capsule, CapsuleCreate, CapsuleUpdate
from app.services.capsule_service import CapsuleService
from app.core.auth_dependencies import get_wallet_address

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
    wallet_address: Optional[str] = Depends(get_wallet_address)
):
    """Query a capsule (requires payment)"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")

    service = CapsuleService()
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

