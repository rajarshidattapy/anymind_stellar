"""
FastAPI dependency functions for authentication
"""
from fastapi import Header
from typing import Optional


def get_wallet_address(x_wallet_address: Optional[str] = Header(None)) -> Optional[str]:
    """
    FastAPI dependency to extract wallet address from request header.
    
    Args:
        x_wallet_address: Wallet address from X-Wallet-Address header
        
    Returns:
        Wallet address string or None if not provided
    """
    return x_wallet_address

