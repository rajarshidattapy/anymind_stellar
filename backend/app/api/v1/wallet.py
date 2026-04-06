from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from app.models.schemas import WalletBalance, Earnings, StakingInfo, StakingCreate
from app.services.wallet_service import WalletService
from app.core.auth_dependencies import get_wallet_address

router = APIRouter()


@router.get("/balance", response_model=WalletBalance)
async def get_balance(wallet_address: Optional[str] = Depends(get_wallet_address)):
    """Get wallet balance"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = WalletService()
    balance = await service.get_balance(wallet_address)
    return balance


@router.get("/earnings", response_model=Earnings)
async def get_earnings(
    wallet_address: Optional[str] = Depends(get_wallet_address),
    period: Optional[str] = None
):
    """Get earnings for a wallet"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = WalletService()
    earnings = await service.get_earnings(wallet_address, period)
    return earnings


@router.get("/staking", response_model=List[StakingInfo])
async def get_staking_info(wallet_address: Optional[str] = Depends(get_wallet_address)):
    """Get staking information for a wallet"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = WalletService()
    return await service.get_staking_info(wallet_address)


@router.post("/staking", response_model=StakingInfo)
async def create_staking(
    staking: StakingCreate,
    wallet_address: Optional[str] = Depends(get_wallet_address)
):
    """Stake tokens on a capsule"""
    if not wallet_address:
        raise HTTPException(status_code=401, detail="Wallet address required")
    
    service = WalletService()
    return await service.create_staking(staking, wallet_address)

