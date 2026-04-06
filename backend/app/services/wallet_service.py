from typing import List, Optional
from datetime import datetime
import logging

import httpx

from app.db.database import get_supabase
from app.models.schemas import WalletBalance, Earnings, StakingInfo, StakingCreate
from app.core.config import settings

logger = logging.getLogger(__name__)


class WalletService:
    def __init__(self):
        self.supabase = get_supabase()
        self.stellar_horizon_url = settings.STELLAR_HORIZON_URL.rstrip("/")

    def _check_supabase(self):
        if not self.supabase:
            raise Exception("Supabase not configured")

    async def get_balance(self, wallet_address: str) -> WalletBalance:
        """Get XLM balance for a Stellar account."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.stellar_horizon_url}/accounts/{wallet_address}",
                    timeout=10.0,
                )

                if response.status_code == 404:
                    return WalletBalance(
                        wallet_address=wallet_address,
                        balance=0.0,
                        currency="XLM",
                    )

                response.raise_for_status()
                data = response.json()
                native_balance = next(
                    (
                        balance
                        for balance in data.get("balances", [])
                        if balance.get("asset_type") == "native"
                    ),
                    None,
                )

                return WalletBalance(
                    wallet_address=wallet_address,
                    balance=float(native_balance.get("balance", 0.0)) if native_balance else 0.0,
                    currency="XLM",
                )
        except Exception as error:
            logger.warning("Error fetching Stellar balance for %s: %s", wallet_address, error)

        return WalletBalance(
            wallet_address=wallet_address,
            balance=0.0,
            currency="XLM",
        )

    async def get_earnings(self, wallet_address: str, period: Optional[str] = None) -> Earnings:
        """Get earnings for a wallet."""
        try:
            self._check_supabase()
            query = self.supabase.table("earnings").select("*").eq("wallet_address", wallet_address)
            if period:
                pass

            result = query.execute()
            total = sum(row.get("amount", 0) for row in result.data)

            return Earnings(
                wallet_address=wallet_address,
                total_earnings=total,
                capsule_earnings=result.data,
                period=period,
            )
        except Exception as error:
            logger.warning("Error fetching earnings for %s: %s", wallet_address, error)
            return Earnings(
                wallet_address=wallet_address,
                total_earnings=0.0,
                capsule_earnings=[],
                period=period,
            )

    async def get_staking_info(self, wallet_address: str) -> List[StakingInfo]:
        """Get staking information for a wallet."""
        try:
            self._check_supabase()
            result = self.supabase.table("staking").select("*").eq("wallet_address", wallet_address).execute()
            return [StakingInfo(**row) for row in result.data]
        except Exception as error:
            logger.warning("Error fetching staking info for %s: %s", wallet_address, error)
            return []

    async def create_staking(self, staking: StakingCreate, wallet_address: str) -> StakingInfo:
        """Create a new staking entry."""
        staking_info = StakingInfo(
            capsule_id=staking.capsule_id,
            wallet_address=wallet_address,
            stake_amount=staking.stake_amount,
            staked_at=datetime.now(),
        )

        try:
            self._check_supabase()
            self.supabase.table("staking").insert({
                "capsule_id": staking.capsule_id,
                "wallet_address": wallet_address,
                "stake_amount": staking.stake_amount,
                "staked_at": staking_info.staked_at.isoformat(),
            }).execute()

            logger.info("Updating capsule %s with stake amount %s", staking.capsule_id, staking.stake_amount)
            capsule_result = self.supabase.table("capsules").select("stake_amount").eq("id", staking.capsule_id).single().execute()
            current_stake = 0.0
            if capsule_result.data:
                current_stake = float(capsule_result.data.get("stake_amount", 0) or 0)

            new_stake = current_stake + staking.stake_amount

            self.supabase.table("capsules").update({
                "stake_amount": new_stake,
                "updated_at": datetime.now().isoformat(),
            }).eq("id", staking.capsule_id).execute()
        except Exception as error:
            logger.error("Error creating staking: %s", error, exc_info=True)

        return staking_info
