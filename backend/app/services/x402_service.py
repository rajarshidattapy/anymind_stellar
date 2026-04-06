"""
x402 Payment Service for Stellar

Implements the x402 HTTP payment protocol for capsule pay-per-query.
Uses OZ Channels facilitator for verify + settle on Stellar.

Flow:
  1. Client hits /capsules/{id}/query without X-PAYMENT header
  2. Server returns 402 with Stellar payment challenge
  3. Client builds Soroban USDC transfer, signs auth entries
  4. Client retries with X-PAYMENT header (Base64 JSON)
  5. Server verifies + settles via facilitator, then processes query
"""

import httpx
import json
import base64
import logging
import math
from typing import Optional
from dataclasses import dataclass

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PaymentContext:
    """Attached to request after successful x402 payment."""
    payer: str
    tx_hash: str
    network: str
    amount_usdc: float


def usd_to_atomic(usd: float) -> str:
    """Convert USD to Stellar USDC atomic units (7 decimals)."""
    return str(math.ceil(usd * 10_000_000))


def atomic_to_usd(atomic: str) -> float:
    """Convert Stellar USDC atomic units to USD."""
    return int(atomic) / 10_000_000


def is_x402_configured() -> bool:
    """Check if x402 Stellar payments are configured."""
    return bool(settings.STELLAR_PAY_TO_ADDRESS)


def build_402_challenge(
    request_url: str,
    price_usd: float,
    description: str,
) -> dict:
    """
    Build a 402 Payment Required challenge response.

    Returns the JSON body that tells the client how to pay.
    """
    return {
        "x402Version": 2,
        "resource": {
            "url": request_url,
            "description": description,
            "mimeType": "application/json",
        },
        "accepts": [
            {
                "scheme": "exact",
                "network": settings.STELLAR_NETWORK,
                "amount": usd_to_atomic(price_usd),
                "payTo": settings.STELLAR_PAY_TO_ADDRESS,
                "maxTimeoutSeconds": 300,
                "asset": settings.STELLAR_USDC_ASSET,
                "extra": {"areFeesSponsored": True},
            }
        ],
    }


def parse_payment_header(header_value: str) -> Optional[dict]:
    """
    Parse X-PAYMENT header value.

    Accepts both raw JSON and Base64-encoded JSON.
    Returns parsed PaymentPayload dict or None if invalid.
    """
    if not header_value:
        return None

    try:
        # Try raw JSON first
        try:
            parsed = json.loads(header_value)
        except json.JSONDecodeError:
            # Fall back to Base64
            decoded = base64.b64decode(header_value).decode("utf-8")
            parsed = json.loads(decoded)

        # Validate structure
        if (
            isinstance(parsed, dict)
            and parsed.get("x402Version") == 2
            and parsed.get("accepted")
            and parsed.get("payload", {}).get("transaction")
        ):
            return parsed
    except Exception as e:
        logger.warning(f"Failed to parse X-PAYMENT header: {e}")

    return None


async def verify_and_settle(
    payment_payload: dict,
    price_usd: float,
    request_url: str,
) -> tuple[bool, Optional[PaymentContext], Optional[str]]:
    """
    Verify and settle an x402 payment via the OZ Channels facilitator.

    Returns:
        (success, payment_context, error_message)
    """
    payment_requirements = {
        "scheme": "exact",
        "network": settings.STELLAR_NETWORK,
        "amount": usd_to_atomic(price_usd),
        "payTo": settings.STELLAR_PAY_TO_ADDRESS,
        "maxTimeoutSeconds": 300,
        "asset": settings.STELLAR_USDC_ASSET,
        "extra": {"areFeesSponsored": True},
    }

    headers = {"Content-Type": "application/json"}
    if settings.OZ_RELAYER_API_KEY:
        headers["x-api-key"] = settings.OZ_RELAYER_API_KEY
        headers["Authorization"] = f"Bearer {settings.OZ_RELAYER_API_KEY}"

    body = {
        "paymentPayload": payment_payload,
        "paymentRequirements": payment_requirements,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Verify
        try:
            verify_resp = await client.post(
                f"{settings.FACILITATOR_URL}/verify",
                headers=headers,
                json=body,
            )
            verify_data = verify_resp.json()
        except Exception as e:
            logger.error(f"Facilitator /verify failed: {e}")
            return False, None, "Payment service unavailable"

        if not verify_data.get("isValid"):
            reason = verify_data.get("invalidReason", "Payment verification failed")
            logger.warning(f"x402 verify rejected: {reason}")
            return False, None, reason

        # Step 2: Settle
        try:
            settle_resp = await client.post(
                f"{settings.FACILITATOR_URL}/settle",
                headers=headers,
                json=body,
            )
            settle_data = settle_resp.json()
        except Exception as e:
            logger.error(f"Facilitator /settle failed: {e}")
            return False, None, "Payment settlement unavailable"

        if not settle_data.get("success"):
            reason = settle_data.get("errorReason", "Settlement failed")
            logger.warning(f"x402 settle rejected: {reason}")
            return False, None, reason

        # Success
        tx_hash = settle_data.get("transaction", "")
        payer = settle_data.get("payer", "")
        network = settle_data.get("network", settings.STELLAR_NETWORK)

        logger.info(f"x402 payment settled: tx={tx_hash}, payer={payer}")

        ctx = PaymentContext(
            payer=payer,
            tx_hash=tx_hash,
            network=network,
            amount_usdc=price_usd,
        )
        return True, ctx, None
