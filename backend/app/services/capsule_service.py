from typing import Optional, List
from datetime import datetime
import uuid

from app.db.database import get_supabase
from app.models.schemas import Capsule, CapsuleCreate, CapsuleUpdate


class CapsuleService:
    def __init__(self):
        self.supabase = get_supabase()

    def _check_supabase(self):
        if not self.supabase:
            raise Exception("Supabase not configured")

    async def get_user_capsules(self, wallet_address: Optional[str]) -> List[Capsule]:
        try:
            self._check_supabase()
            query = self.supabase.table("capsules").select("*")
            if wallet_address:
                query = query.eq("creator_wallet", wallet_address)

            result = query.execute()
            return [Capsule(**row) for row in result.data]
        except Exception as error:
            print(f"Error fetching capsules: {error}")
            return []

    async def get_capsule(self, capsule_id: str) -> Optional[Capsule]:
        try:
            self._check_supabase()
            result = self.supabase.table("capsules").select("*").eq("id", capsule_id).single().execute()
            if result.data:
                return Capsule(**result.data)
        except Exception as error:
            print(f"Error fetching capsule: {error}")
        return None

    async def create_capsule(self, capsule_data: CapsuleCreate, wallet_address: str) -> Capsule:
        capsule_id = str(uuid.uuid4())
        now = datetime.now()

        capsule = Capsule(
            id=capsule_id,
            name=capsule_data.name,
            description=capsule_data.description,
            category=capsule_data.category,
            creator_wallet=wallet_address,
            price_per_query=capsule_data.price_per_query,
            stake_amount=0.0,
            reputation=0.0,
            query_count=0,
            rating=0.0,
            created_at=now,
            updated_at=now,
            metadata=capsule_data.metadata,
        )

        try:
            self._check_supabase()
            self.supabase.table("capsules").insert({
                "id": capsule.id,
                "name": capsule.name,
                "description": capsule.description,
                "category": capsule.category,
                "creator_wallet": wallet_address,
                "price_per_query": capsule.price_per_query,
                "stake_amount": 0.0,
                "reputation": 0.0,
                "query_count": 0,
                "rating": 0.0,
                "created_at": capsule.created_at.isoformat(),
                "updated_at": capsule.updated_at.isoformat(),
                "metadata": capsule.metadata or {},
            }).execute()
        except Exception as error:
            print(f"Error creating capsule: {error}")

        return capsule

    async def update_capsule(self, capsule_id: str, capsule_update: CapsuleUpdate, wallet_address: str) -> Optional[Capsule]:
        update_data = {"updated_at": datetime.now().isoformat()}

        if capsule_update.name:
            update_data["name"] = capsule_update.name
        if capsule_update.description:
            update_data["description"] = capsule_update.description
        if capsule_update.price_per_query:
            update_data["price_per_query"] = capsule_update.price_per_query
        if capsule_update.metadata:
            update_data["metadata"] = capsule_update.metadata

        try:
            self._check_supabase()
            result = self.supabase.table("capsules").update(update_data).eq("id", capsule_id).eq("creator_wallet", wallet_address).execute()
            if result.data:
                return await self.get_capsule(capsule_id)
        except Exception as error:
            print(f"Error updating capsule: {error}")

        return None

    async def delete_capsule(self, capsule_id: str, wallet_address: str):
        try:
            self._check_supabase()
            self.supabase.table("capsules").delete().eq("id", capsule_id).eq("creator_wallet", wallet_address).execute()
        except Exception as error:
            print(f"Error deleting capsule: {error}")

    async def query_capsule(
        self,
        capsule_id: str,
        prompt: str,
        wallet_address: str,
        amount_paid: float = 0.0,
        payment_method: Optional[str] = None,
        payment_reference: Optional[str] = None,
    ) -> dict:
        capsule = await self.get_capsule(capsule_id)
        if not capsule:
            raise Exception("Capsule not found")

        if amount_paid > 0:
            await self._record_earnings(capsule_id, capsule.creator_wallet, amount_paid)

        await self._increment_query_count(capsule_id)

        result = {
            "response": f"Query processed for capsule '{capsule.name}'. LLM integration pending.",
            "capsule_id": capsule_id,
            "price_paid": amount_paid,
        }

        if payment_method:
            result["payment_method"] = payment_method
        if payment_reference:
            result["payment_reference"] = payment_reference

        return result

    async def _record_earnings(self, capsule_id: str, wallet_address: str, amount: float):
        try:
            self._check_supabase()
            self.supabase.table("earnings").insert({
                "wallet_address": wallet_address,
                "capsule_id": capsule_id,
                "amount": amount,
                "created_at": datetime.now().isoformat(),
            }).execute()
            print(f"Recorded earnings: {amount} for wallet {wallet_address}")
        except Exception as error:
            print(f"Error recording earnings: {error}")

    async def _increment_query_count(self, capsule_id: str):
        try:
            self._check_supabase()
            result = self.supabase.table("capsules").select("query_count").eq("id", capsule_id).single().execute()
            if result.data:
                current_count = result.data.get("query_count", 0)
                self.supabase.table("capsules").update({
                    "query_count": current_count + 1,
                    "updated_at": datetime.now().isoformat(),
                }).eq("id", capsule_id).execute()
        except Exception as error:
            print(f"Error incrementing query count: {error}")
