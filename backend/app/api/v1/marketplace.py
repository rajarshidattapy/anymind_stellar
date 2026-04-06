from fastapi import APIRouter, Query
from typing import Optional, List
from app.models.schemas import Capsule, MarketplaceFilters
from app.services.marketplace_service import MarketplaceService

router = APIRouter()


@router.get("/", response_model=List[Capsule])
async def browse_marketplace(
    category: Optional[str] = Query(None),
    min_reputation: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("popular"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Browse marketplace capsules with filters"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Marketplace browse request: category={category}, sort_by={sort_by}, limit={limit}, offset={offset}")
    
    filters = MarketplaceFilters(
        category=category,
        min_reputation=min_reputation,
        max_price=max_price,
        sort_by=sort_by
    )
    
    service = MarketplaceService()
    result = await service.browse_capsules(filters, limit, offset)
    logger.info(f"Marketplace browse returned {len(result)} capsules")
    return result


@router.get("/trending", response_model=List[Capsule])
async def get_trending(limit: int = Query(10, ge=1, le=50)):
    """Get trending capsules"""
    service = MarketplaceService()
    return await service.get_trending_capsules(limit)


@router.get("/categories", response_model=List[str])
async def get_categories():
    """Get all available categories"""
    service = MarketplaceService()
    return await service.get_categories()


@router.get("/search", response_model=List[Capsule])
async def search_capsules(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Search capsules by name or description"""
    service = MarketplaceService()
    return await service.search_capsules(q, limit)


@router.get("/debug")
async def debug_marketplace():
    """Debug endpoint to check all capsules in database"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from app.db.database import get_supabase
        supabase = get_supabase()
        
        if not supabase:
            return {"error": "Supabase not configured"}
        
        # Get all capsules
        all_capsules = supabase.table("capsules").select("*").execute()
        
        logger.info(f"DEBUG: Total capsules in DB: {len(all_capsules.data)}")
        
        result = {
            "total_capsules": len(all_capsules.data),
            "capsules": []
        }
        
        for row in all_capsules.data:
            stake_amount = row.get("stake_amount")
            result["capsules"].append({
                "id": row.get("id"),
                "name": row.get("name"),
                "stake_amount": stake_amount,
                "stake_amount_type": str(type(stake_amount)),
                "stake_amount_float": float(stake_amount) if stake_amount is not None else None,
                "stake_amount > 0": float(stake_amount) > 0 if stake_amount is not None else False
            })
        
        return result
    except Exception as e:
        logger.error(f"Debug error: {e}", exc_info=True)
        return {"error": str(e)}

