from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class MemorySize(str, Enum):
    SMALL = "Small"
    MEDIUM = "Medium"
    LARGE = "Large"


# Message Models
class Message(BaseModel):
    id: Optional[str] = None
    role: MessageRole
    content: str
    timestamp: Optional[datetime] = None


class MessageCreate(BaseModel):
    role: MessageRole
    content: str


# Chat Models
class Chat(BaseModel):
    id: str
    name: str
    memory_size: MemorySize
    last_message: Optional[str] = None
    timestamp: datetime
    message_count: int
    messages: List[Message] = []
    agent_id: Optional[str] = None
    capsule_id: Optional[str] = None  # Capsule scope for memory isolation
    user_wallet: Optional[str] = None
    web_search_enabled: bool = False  # Enable web search via Tavily


class ChatCreate(BaseModel):
    name: str
    agent_id: Optional[str] = None  # Optional since it's in the URL path
    capsule_id: Optional[str] = None  # Optional capsule scope
    memory_size: MemorySize = MemorySize.SMALL
    web_search_enabled: bool = False


class ChatUpdate(BaseModel):
    name: Optional[str] = None
    memory_size: Optional[MemorySize] = None
    web_search_enabled: Optional[bool] = None


# Agent Models
class Agent(BaseModel):
    id: str
    name: str
    display_name: str
    platform: str
    api_key_configured: bool
    model: Optional[str] = None
    user_wallet: Optional[str] = None
    api_key: Optional[str] = None  # Only included when needed, not in responses


class AgentCreate(BaseModel):
    name: str
    display_name: str
    platform: str
    api_key: str
    model: Optional[str] = None


class AgentUpdate(BaseModel):
    display_name: Optional[str] = None
    model: Optional[str] = None


# Capsule Models
class Capsule(BaseModel):
    id: str
    name: str
    description: str
    category: str
    creator_wallet: str
    price_per_query: float
    stake_amount: float
    reputation: float
    query_count: int
    rating: float
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None


class CapsuleCreate(BaseModel):
    name: str
    description: str
    category: str
    price_per_query: float
    metadata: Optional[Dict[str, Any]] = None


class CapsuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_query: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


# Marketplace Models
class MarketplaceFilters(BaseModel):
    category: Optional[str] = None
    min_reputation: Optional[float] = None
    max_price: Optional[float] = None
    sort_by: Optional[str] = "popular"  # popular, newest, price_low, price_high, rating


# Wallet Models
class WalletBalance(BaseModel):
    wallet_address: str
    balance: float
    currency: str = "SOL"


class Earnings(BaseModel):
    wallet_address: str
    total_earnings: float
    capsule_earnings: List[Dict[str, Any]] = []
    period: Optional[str] = None


# Staking Models
class StakingInfo(BaseModel):
    capsule_id: str
    wallet_address: str
    stake_amount: float
    staked_at: datetime


class StakingCreate(BaseModel):
    capsule_id: str
    stake_amount: float


# LLM Response Models
class LLMResponse(BaseModel):
    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None

