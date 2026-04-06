"""
Cache service using Vercel KV (Upstash Redis) for server-side caching
Falls back gracefully if Redis is not configured

Vercel KV uses Upstash Redis under the hood.
For Python, use the upstash-redis library.

Setup:
1. Install: pip install upstash-redis
2. Set environment variables:
   - KV_REST_API_URL (from Vercel KV dashboard)
   - KV_REST_API_TOKEN (from Vercel KV dashboard)
   OR
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
"""
from typing import Optional, Any
import json
import os
from datetime import timedelta

try:
    from upstash_redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    Redis = None  # type: ignore
    REDIS_AVAILABLE = False
    print("⚠️  upstash-redis not installed. Install with: pip install upstash-redis")
    print("⚠️  Cache service will use in-memory storage only.")

# Fallback in-memory cache if KV is not available
_in_memory_cache: dict = {}


class CacheService:
    """
    Service for caching data using Vercel KV (Upstash Redis)
    Provides fallback to in-memory storage if Redis is not configured
    """
    
    def __init__(self):
        self.redis: Optional[Redis] = None
        self.redis_available = REDIS_AVAILABLE and self._init_redis()
        if not self.redis_available:
            print("⚠️  Vercel KV/Redis not available. Using in-memory cache (data lost on restart).")
    
    def _init_redis(self) -> bool:
        """Initialize Redis connection"""
        try:
            if not REDIS_AVAILABLE:
                return False
            
            # Check for Vercel KV environment variables (try all possible names)
            url = (
                os.getenv('KV_REST_API_URL') or 
                os.getenv('KV_URL') or 
                os.getenv('REDIS_URL') or 
                os.getenv('UPSTASH_REDIS_REST_URL')
            )
            token = (
                os.getenv('KV_REST_API_TOKEN') or 
                os.getenv('UPSTASH_REDIS_REST_TOKEN')
            )
            
            if not url or not token:
                print("⚠️  Redis credentials not found. Set KV_REST_API_URL and KV_REST_API_TOKEN")
                return False
            
            # Initialize Redis client
            self.redis = Redis(url=url, token=token)
            
            # Test connection
            self.redis.ping()
            print("✅ Vercel KV (Redis) connected successfully")
            return True
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Optional[Any]:
        """
        Get a value from cache
        Args:
            key: Cache key
            default: Default value if key doesn't exist
        Returns:
            Cached value or default
        """
        try:
            if self.redis_available and self.redis:
                value = self.redis.get(key)
                if value is None:
                    return default
                # Redis returns bytes or strings, parse if needed
                if isinstance(value, bytes):
                    value = value.decode('utf-8')
                if isinstance(value, str):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        return value
                return value
            else:
                # Fallback to in-memory
                return _in_memory_cache.get(key, default)
        except Exception as e:
            print(f"Error getting cache key '{key}': {e}")
            return default
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
        """
        Set a value in cache
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl_seconds: Time to live in seconds (None = no expiration)
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.redis_available and self.redis:
                # Serialize value to JSON
                if not isinstance(value, (str, int, float, bool)):
                    value = json.dumps(value)
                
                if ttl_seconds:
                    self.redis.setex(key, ttl_seconds, value)
                else:
                    self.redis.set(key, value)
                return True
            else:
                # Fallback to in-memory (no TTL support)
                _in_memory_cache[key] = value
                return True
        except Exception as e:
            print(f"Error setting cache key '{key}': {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from cache
        Args:
            key: Cache key to delete
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.redis_available and self.redis:
                self.redis.delete(key)
                return True
            else:
                _in_memory_cache.pop(key, None)
                return True
        except Exception as e:
            print(f"Error deleting cache key '{key}': {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching a pattern (use with caution)
        Args:
            pattern: Pattern to match (e.g., 'user:*')
        Returns:
            Number of keys deleted
        """
        try:
            if self.redis_available and self.redis:
                # Use SCAN to find matching keys
                # Note: This is a simplified version - for production, use cursor-based scanning
                keys_to_delete = []
                cursor = 0
                while True:
                    cursor, keys = self.redis.scan(cursor, match=pattern, count=100)
                    keys_to_delete.extend(keys)
                    if cursor == 0:
                        break
                
                if keys_to_delete:
                    self.redis.delete(*keys_to_delete)
                return len(keys_to_delete)
            else:
                # Fallback: delete matching keys from in-memory cache
                keys_to_delete = [k for k in _in_memory_cache.keys() if pattern.replace('*', '') in k]
                for key in keys_to_delete:
                    _in_memory_cache.pop(key, None)
                return len(keys_to_delete)
        except Exception as e:
            print(f"Error clearing cache pattern '{pattern}': {e}")
            return 0
    
    def get_user_preferences(self, wallet_address: str) -> dict:
        """Get user preferences from cache"""
        key = f"user:preferences:{wallet_address}"
        return self.get(key, {})
    
    def set_user_preferences(self, wallet_address: str, preferences: dict, ttl_seconds: int = 86400 * 30) -> bool:
        """
        Set user preferences in cache (30 days TTL)
        Args:
            wallet_address: User's wallet address
            preferences: Preferences dict
            ttl_seconds: TTL in seconds (default 30 days)
        """
        key = f"user:preferences:{wallet_address}"
        return self.set(key, preferences, ttl_seconds)
    
    def get_user_agents(self, wallet_address: str) -> list:
        """Get user's custom agents from Redis"""
        key = f"user:agents:{wallet_address}"
        return self.get(key, [])
    
    def set_user_agents(self, wallet_address: str, agents: list, ttl_seconds: Optional[int] = None) -> bool:
        """
        Save user's custom agents to Redis (no TTL for persistence)
        Args:
            wallet_address: User's wallet address
            agents: List of agent dictionaries
            ttl_seconds: TTL in seconds (None = no expiration, persistent)
        """
        key = f"user:agents:{wallet_address}"
        return self.set(key, agents, ttl_seconds)
    
    def add_user_agent(self, wallet_address: str, agent: dict) -> bool:
        """Add a single agent to user's agent list in Redis"""
        agents = self.get_user_agents(wallet_address)
        # Check if agent already exists (by id)
        existing_index = next((i for i, a in enumerate(agents) if a.get('id') == agent.get('id')), None)
        if existing_index is not None:
            agents[existing_index] = agent  # Update existing
        else:
            agents.append(agent)  # Add new
        return self.set_user_agents(wallet_address, agents)
    
    def get_chat_cache(self, agent_id: str, wallet_address: str) -> Optional[list]:
        """Get cached chat list for an agent"""
        key = f"chats:{agent_id}:{wallet_address}"
        return self.get(key)
    
    def set_chat_cache(self, agent_id: str, wallet_address: str, chats: list, ttl_seconds: int = 300) -> bool:
        """
        Cache chat list for an agent (5 minutes TTL)
        Args:
            agent_id: Agent ID
            wallet_address: User's wallet address
            chats: List of chats
            ttl_seconds: TTL in seconds (default 5 minutes)
        """
        key = f"chats:{agent_id}:{wallet_address}"
        return self.set(key, chats, ttl_seconds)
    
    def invalidate_chat_cache(self, agent_id: str, wallet_address: str) -> bool:
        """Invalidate chat cache when chats are modified"""
        key = f"chats:{agent_id}:{wallet_address}"
        return self.delete(key)
    
    # ============================================
    # Chat and Message Storage (Persistent)
    # ============================================
    
    def save_chat(self, chat_data: dict) -> bool:
        """
        Save a chat to Redis (persistent storage)
        Args:
            chat_data: Chat dictionary with all fields
        Returns:
            True if successful
        """
        chat_id = chat_data.get("id")
        if not chat_id:
            return False
        
        key = f"chat:{chat_id}"
        # Store without TTL for persistence
        return self.set(key, chat_data, ttl_seconds=None)
    
    def get_chat(self, chat_id: str) -> Optional[dict]:
        """
        Get a chat from Redis
        Args:
            chat_id: Chat ID
        Returns:
            Chat dictionary or None
        """
        key = f"chat:{chat_id}"
        return self.get(key)
    
    def delete_chat(self, chat_id: str) -> bool:
        """Delete a chat from Redis"""
        key = f"chat:{chat_id}"
        return self.delete(key)
    
    def save_messages(self, chat_id: str, messages: list) -> bool:
        """
        Save messages for a chat to Redis
        Args:
            chat_id: Chat ID
            messages: List of message dictionaries
        Returns:
            True if successful
        """
        key = f"messages:{chat_id}"
        # Store without TTL for persistence
        return self.set(key, messages, ttl_seconds=None)
    
    def get_messages(self, chat_id: str) -> list:
        """
        Get messages for a chat from Redis (sorted by timestamp)
        Args:
            chat_id: Chat ID
        Returns:
            List of message dictionaries sorted by timestamp
        """
        key = f"messages:{chat_id}"
        messages = self.get(key, [])
        
        # Sort by timestamp (oldest first)
        if messages:
            try:
                messages.sort(key=lambda x: x.get("timestamp", ""))
            except Exception as e:
                print(f"Error sorting messages: {e}")
        
        return messages
    
    def add_message(self, chat_id: str, message: dict) -> bool:
        """
        Add a single message to a chat
        Args:
            chat_id: Chat ID
            message: Message dictionary
        Returns:
            True if successful
        """
        messages = self.get_messages(chat_id)
        messages.append(message)
        return self.save_messages(chat_id, messages)
    
    def delete_messages(self, chat_id: str) -> bool:
        """Delete all messages for a chat"""
        key = f"messages:{chat_id}"
        return self.delete(key)
    
    def get_chat_list(self, agent_id: str, wallet_address: str) -> list:
        """
        Get list of chat IDs for an agent/user
        Args:
            agent_id: Agent ID
            wallet_address: User wallet address
        Returns:
            List of chat IDs
        """
        key = f"chats:agent:{agent_id}:wallet:{wallet_address}"
        return self.get(key, [])
    
    def add_chat_to_list(self, agent_id: str, wallet_address: str, chat_id: str) -> bool:
        """
        Add a chat ID to the agent's chat list
        Args:
            agent_id: Agent ID
            wallet_address: User wallet address
            chat_id: Chat ID to add
        Returns:
            True if successful
        """
        chat_list = self.get_chat_list(agent_id, wallet_address)
        if chat_id not in chat_list:
            chat_list.append(chat_id)
            key = f"chats:agent:{agent_id}:wallet:{wallet_address}"
            return self.set(key, chat_list, ttl_seconds=None)
        return True
    
    def remove_chat_from_list(self, agent_id: str, wallet_address: str, chat_id: str) -> bool:
        """
        Remove a chat ID from the agent's chat list
        Args:
            agent_id: Agent ID
            wallet_address: User wallet address
            chat_id: Chat ID to remove
        Returns:
            True if successful
        """
        chat_list = self.get_chat_list(agent_id, wallet_address)
        if chat_id in chat_list:
            chat_list.remove(chat_id)
            key = f"chats:agent:{agent_id}:wallet:{wallet_address}"
            return self.set(key, chat_list, ttl_seconds=None)
        return True


# Global cache service instance
cache_service = CacheService()

