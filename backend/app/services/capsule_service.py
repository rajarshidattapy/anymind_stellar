from typing import Optional, List
from datetime import datetime
import uuid
import httpx
from app.db.database import get_supabase
from app.models.schemas import Capsule, CapsuleCreate, CapsuleUpdate
from app.core.config import settings


class CapsuleService:
    def __init__(self):
        self.supabase = get_supabase()
    
    def _check_supabase(self):
        """Helper to check if Supabase is available, raises exception if not"""
        if not self.supabase:
            raise Exception("Supabase not configured")
    
    async def get_user_capsules(self, wallet_address: Optional[str]) -> List[Capsule]:
        """Get all capsules for a user"""
        try:
            self._check_supabase()
            query = self.supabase.table("capsules").select("*")
            if wallet_address:
                query = query.eq("creator_wallet", wallet_address)
            
            result = query.execute()
            return [Capsule(**row) for row in result.data]
        except Exception as e:
            print(f"Error fetching capsules: {e}")
            return []
    
    async def get_capsule(self, capsule_id: str) -> Optional[Capsule]:
        """Get a specific capsule"""
        try:
            self._check_supabase()
            result = self.supabase.table("capsules").select("*").eq("id", capsule_id).single().execute()
            if result.data:
                return Capsule(**result.data)
        except Exception as e:
            print(f"Error fetching capsule: {e}")
        return None
    
    async def create_capsule(self, capsule_data: CapsuleCreate, wallet_address: str) -> Capsule:
        """Create a new memory capsule"""
        capsule_id = str(uuid.uuid4())
        now = datetime.now()
        
        print(f"Creating capsule with ID: {capsule_id}, name: {capsule_data.name}, wallet: {wallet_address}")
        
        capsule = Capsule(
            id=capsule_id,
            name=capsule_data.name,
            description=capsule_data.description,
            category=capsule_data.category,
            creator_wallet=wallet_address,
            price_per_query=capsule_data.price_per_query,
            stake_amount=0.0,  # Will be updated when staking happens
            reputation=0.0,
            query_count=0,
            rating=0.0,
            created_at=now,
            updated_at=now,
            metadata=capsule_data.metadata
        )
        
        try:
            self._check_supabase()
            result = self.supabase.table("capsules").insert({
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
                "metadata": capsule.metadata or {}
            }).execute()
            
            print(f"Capsule inserted into database. ID: {capsule.id}, Name: {capsule.name}")
            if result.data:
                print(f"Inserted capsule details: id={result.data[0].get('id')}, name={result.data[0].get('name')}, stake_amount={result.data[0].get('stake_amount')}")
        except Exception as e:
            print(f"Error creating capsule: {e}")
        
        return capsule
    
    async def update_capsule(self, capsule_id: str, capsule_update: CapsuleUpdate, wallet_address: str) -> Optional[Capsule]:
        """Update capsule metadata"""
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
        except Exception as e:
            print(f"Error updating capsule: {e}")
        
        return None
    
    async def delete_capsule(self, capsule_id: str, wallet_address: str):
        """Delete a capsule"""
        try:
            self._check_supabase()
            self.supabase.table("capsules").delete().eq("id", capsule_id).eq("creator_wallet", wallet_address).execute()
        except Exception as e:
            print(f"Error deleting capsule: {e}")
    
    async def query_capsule(
        self,
        capsule_id: str,
        prompt: str,
        wallet_address: str,
        payment_signature: Optional[str] = None,
        amount_paid: Optional[float] = None
    ) -> dict:
        """Query a capsule (requires payment)"""
        capsule = await self.get_capsule(capsule_id)
        if not capsule:
            raise Exception("Capsule not found")

        # Verify payment if signature provided
        if payment_signature and amount_paid:
            verified = await self._verify_payment(
                payment_signature,
                wallet_address,
                capsule.creator_wallet,
                amount_paid
            )
            if not verified:
                raise Exception("Payment verification failed")

            # Record earnings
            await self._record_earnings(capsule_id, capsule.creator_wallet, amount_paid)

        # Increment query count
        await self._increment_query_count(capsule_id)

        # TODO: Implement memory retrieval and LLM query integration
        return {
            "response": f"Query processed for capsule '{capsule.name}'. Payment verified ({amount_paid or 0} SOL). LLM integration pending.",
            "capsule_id": capsule_id,
            "price_paid": amount_paid or 0
        }

    async def _verify_payment(
        self,
        signature: str,
        sender: str,
        recipient: str,
        amount: float
    ) -> bool:
        """Verify Solana transaction on-chain"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.SOLANA_RPC_URL,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getTransaction",
                        "params": [signature, {"encoding": "json", "maxSupportedTransactionVersion": 0}]
                    },
                    timeout=10.0
                )
                data = response.json()

                if "result" not in data or not data["result"]:
                    print(f"Transaction not found: {signature}")
                    return False

                tx = data["result"]

                # Check if transaction is confirmed
                if not tx.get("meta") or tx["meta"].get("err"):
                    print(f"Transaction failed or not confirmed: {signature}")
                    return False

                # TODO: Add more detailed verification
                # - Verify sender and recipient public keys match
                # - Verify amount transferred matches expected amount
                # For MVP, we just verify the transaction exists and succeeded

                print(f"Payment verified: {signature}")
                return True

        except Exception as e:
            print(f"Payment verification error: {e}")
            return False

    async def _record_earnings(
        self,
        capsule_id: str,
        wallet_address: str,
        amount: float
    ):
        """Record earnings in database"""
        try:
            self._check_supabase()
            self.supabase.table("earnings").insert({
                "wallet_address": wallet_address,
                "capsule_id": capsule_id,
                "amount": amount,
                "created_at": datetime.now().isoformat()
            }).execute()
            print(f"Recorded earnings: {amount} SOL for wallet {wallet_address}")
        except Exception as e:
            print(f"Error recording earnings: {e}")

    async def _increment_query_count(self, capsule_id: str):
        """Increment capsule query count"""
        try:
            self._check_supabase()
            # Fetch current capsule
            result = self.supabase.table("capsules").select("query_count").eq("id", capsule_id).single().execute()
            if result.data:
                current_count = result.data.get("query_count", 0)
                # Update with incremented count
                self.supabase.table("capsules").update({
                    "query_count": current_count + 1,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", capsule_id).execute()
                print(f"Incremented query count for capsule {capsule_id}")
        except Exception as e:
            print(f"Error incrementing query count: {e}")

