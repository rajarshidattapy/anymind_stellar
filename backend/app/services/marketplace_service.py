from typing import List
from app.db.database import get_supabase
from app.models.schemas import Capsule, MarketplaceFilters


class MarketplaceService:
    def __init__(self):
        self.supabase = get_supabase()
    
    def _check_supabase(self):
        """Helper to check if Supabase is available, raises exception if not"""
        if not self.supabase:
            raise Exception("Supabase not configured")
    
    async def browse_capsules(self, filters: MarketplaceFilters, limit: int, offset: int) -> List[Capsule]:
        """Browse marketplace with filters - only shows capsules that have been staked"""
        try:
            self._check_supabase()
            
            # Debug: Check all capsules first
            all_capsules = self.supabase.table("capsules").select("id, name, stake_amount").execute()
            print(f"Total capsules in DB: {len(all_capsules.data)}")
            if all_capsules.data:
                print(f"All capsule stake_amounts: {[(row.get('id'), row.get('name'), row.get('stake_amount'), type(row.get('stake_amount'))) for row in all_capsules.data]}")
            
            # Only show capsules that have been staked (stake_amount > 0)
            # Try filtering with numeric comparison - Supabase might need the value as string for NUMERIC type
            # First, get all capsules and filter in Python to ensure it works
            all_query = self.supabase.table("capsules").select("*")
            
            if filters.category:
                all_query = all_query.eq("category", filters.category)
            if filters.min_reputation:
                all_query = all_query.gte("reputation", filters.min_reputation)
            if filters.max_price:
                all_query = all_query.lte("price_per_query", filters.max_price)
            
            # Get all matching capsules first
            all_result = all_query.execute()
            
            # Filter in Python to ensure stake_amount > 0 (handles type conversion issues)
            filtered_capsules = []
            for row in all_result.data:
                stake_amount = row.get("stake_amount")
                # Debug each capsule
                print(f"Checking capsule {row.get('id')}: stake_amount={stake_amount}, type={type(stake_amount)}")
                
                # Convert to float if it's a string or other type
                if stake_amount is not None:
                    try:
                        stake_float = float(stake_amount)
                        print(f"  Converted to float: {stake_float}, is > 0: {stake_float > 0}")
                        if stake_float > 0:
                            filtered_capsules.append(row)
                            print(f"  ✓ Added to filtered list")
                        else:
                            print(f"  ✗ Skipped (stake_amount <= 0)")
                    except (ValueError, TypeError) as e:
                        # Skip if we can't convert to float
                        print(f"  ✗ Error converting to float: {e}")
                        continue
                else:
                    print(f"  ✗ Skipped (stake_amount is None)")
            
            # Apply sorting
            if filters.sort_by == "popular":
                filtered_capsules.sort(key=lambda x: x.get("query_count", 0), reverse=True)
            elif filters.sort_by == "newest":
                filtered_capsules.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            elif filters.sort_by == "price_low":
                filtered_capsules.sort(key=lambda x: float(x.get("price_per_query", 0) or 0))
            elif filters.sort_by == "price_high":
                filtered_capsules.sort(key=lambda x: float(x.get("price_per_query", 0) or 0), reverse=True)
            elif filters.sort_by == "rating":
                filtered_capsules.sort(key=lambda x: float(x.get("rating", 0) or 0), reverse=True)
            
            # Apply pagination
            paginated_capsules = filtered_capsules[offset:offset + limit]
            
            print(f"Marketplace query: {len(all_result.data)} total, {len(filtered_capsules)} with stake > 0, returning {len(paginated_capsules)}")
            if paginated_capsules:
                print(f"Sample capsule stake_amounts: {[row.get('stake_amount') for row in paginated_capsules[:3]]}")
            
            return [Capsule(**row) for row in paginated_capsules]
        except Exception as e:
            print(f"Error browsing marketplace: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_trending_capsules(self, limit: int) -> List[Capsule]:
        """Get trending capsules - only shows capsules that have been staked"""
        try:
            self._check_supabase()
            # Get all capsules, filter by stake_amount > 0 in Python
            result = self.supabase.table("capsules").select("*").order("query_count", desc=True).execute()
            # Filter to only show staked capsules
            filtered = [row for row in result.data if row.get("stake_amount") and float(row.get("stake_amount") or 0) > 0]
            return [Capsule(**row) for row in filtered[:limit]]
        except Exception as e:
            print(f"Error fetching trending: {e}")
            return []
    
    async def get_categories(self) -> List[str]:
        """Get all available categories"""
        try:
            self._check_supabase()
            result = self.supabase.table("capsules").select("category").execute()
            categories = list(set([row["category"] for row in result.data]))
            return sorted(categories)
        except Exception as e:
            print(f"Error fetching categories: {e}")
            return ["Finance", "Gaming", "Health", "Technology", "Education"]
    
    async def search_capsules(self, query: str, limit: int) -> List[Capsule]:
        """Search capsules by name or description - only shows capsules that have been staked"""
        try:
            self._check_supabase()
            # Supabase text search (if configured)
            result = self.supabase.table("capsules").select("*").or_(f"name.ilike.%{query}%,description.ilike.%{query}%").execute()
            # Filter to only show staked capsules
            filtered = [row for row in result.data if row.get("stake_amount") and float(row.get("stake_amount") or 0) > 0]
            return [Capsule(**row) for row in filtered[:limit]]
        except Exception as e:
            print(f"Error searching capsules: {e}")
            return []

