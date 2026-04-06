from typing import Optional, List
from datetime import datetime
import uuid
from app.db.database import get_supabase
from app.models.schemas import Chat, ChatCreate, ChatUpdate, Message, MessageCreate, Agent, AgentCreate, AgentUpdate, AgentUpdate
from app.services.cache_service import cache_service


class AgentService:
    # Class-level storage for in-memory agents and chats (persists across requests)
    _in_memory_agents: dict = {}
    _in_memory_chats: dict = {}
    _in_memory_messages: dict = {}
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def _check_supabase(self):
        """Helper to check if Supabase is available, raises exception if not"""
        if not self.supabase:
            raise Exception("Supabase not configured")
    
    async def get_user_agents(self, wallet_address: Optional[str]) -> List[Agent]:
        """Get all agents for a user (without API keys) - loads from Redis first"""
        agents = []
        
        # Try Redis first (primary storage)
        if wallet_address and cache_service.redis_available:
            try:
                redis_agents = cache_service.get_user_agents(wallet_address)
                if redis_agents:
                    agents = [Agent(**agent_data) for agent_data in redis_agents]
                    # print(f"✅ Loaded {len(agents)} agents from Redis")
            except Exception as e:
                # print(f"⚠️  Error loading agents from Redis: {e}")
                pass
        
        # Fallback to Supabase if Redis has no agents
        if not agents:
            try:
                self._check_supabase()
                query = self.supabase.table("agents").select("id, name, display_name, platform, api_key_configured, model, user_wallet")
                if wallet_address:
                    query = query.eq("user_wallet", wallet_address)
                
                result = query.execute()
                for row in result.data:
                    agent = Agent(**row)
                    agent.api_key = None  # Don't expose API key
                    agents.append(agent)
                
                # Save to Redis for future use
                if wallet_address and cache_service.redis_available and agents:
                    try:
                        agents_data = [
                            {
                                "id": a.id,
                                "name": a.name,
                                "display_name": a.display_name,
                                "platform": a.platform,
                                "api_key_configured": a.api_key_configured,
                                "model": a.model,
                                "user_wallet": a.user_wallet
                            }
                            for a in agents
                        ]
                        cache_service.set_user_agents(wallet_address, agents_data)
                        # print(f"✅ Synced {len(agents)} agents from Supabase to Redis")
                    except Exception as e:
                        # print(f"⚠️  Error syncing agents to Redis: {e}")
                        pass
            except Exception as e:
                # print(f"⚠️  Error fetching agents from Supabase: {e}")
                pass
                # Check in-memory storage as last resort
                for agent_id, agent_data in AgentService._in_memory_agents.items():
                    if not wallet_address or agent_data.get("user_wallet") == wallet_address:
                        agent = Agent(**agent_data)
                        agent.api_key = None  # Don't expose API key
                        agents.append(agent)
        
        # No default agents - users must add their own
        return agents
    
    async def get_agent(self, agent_id: str, wallet_address: Optional[str]) -> Optional[Agent]:
        """Get a specific agent with API key (for internal use)"""
        # No default agents - check user's agents only
        
        # Check in-memory storage (for custom agents) - has API key
        if agent_id in AgentService._in_memory_agents:
            return Agent(**AgentService._in_memory_agents[agent_id])
        
        # Try Supabase for all agents (including custom) - has API key stored
        try:
            self._check_supabase()
            query = self.supabase.table("agents").select("*").eq("id", agent_id)
            if wallet_address:
                query = query.eq("user_wallet", wallet_address)
            
            result = query.single().execute()
            if result.data:
                return Agent(**result.data)
        except Exception as e:
            # Supabase query failed, continue to other sources
            # print(f"Error fetching agent from Supabase: {e}")
            pass
        
        # Check Redis for custom agents (if wallet_address provided) - no API key here
        if wallet_address and cache_service.redis_available and agent_id.startswith("custom-"):
            try:
                agents_data = cache_service.get_user_agents(wallet_address)
                for agent_data in agents_data:
                    if agent_data.get("id") == agent_id:
                        # Try to get API key from in-memory if available
                        if agent_id in AgentService._in_memory_agents:
                            return Agent(**AgentService._in_memory_agents[agent_id])
                        # Otherwise return without API key (will cause API errors but at least agent exists)
                        return Agent(**agent_data, api_key=None)
            except Exception as e:
                # print(f"Error loading agent from Redis: {e}")
                pass
        
        return None
    
    async def create_agent(self, agent_data: AgentCreate, wallet_address: str) -> Agent:
        """Create a new agent"""
        agent_id = f"custom-{uuid.uuid4().hex[:8]}"
        agent = Agent(
            id=agent_id,
            name=agent_data.name,
            display_name=agent_data.display_name,
            platform=agent_data.platform,
            api_key_configured=True,
            model=agent_data.model,
            user_wallet=wallet_address,
            api_key=agent_data.api_key  # Store API key
        )
        
        # Save agent data (without API key for storage)
        agent_storage_data = {
            "id": agent.id,
            "name": agent.name,
            "display_name": agent.display_name,
            "platform": agent.platform,
            "api_key_configured": True,
            "model": agent.model,
            "user_wallet": wallet_address
        }
        
        # Save to Redis (primary storage)
        try:
            cache_service.add_user_agent(wallet_address, agent_storage_data)
            # print(f"✅ Agent '{agent.display_name}' saved to Redis")
        except Exception as e:
            # print(f"❌ Error saving agent to Redis: {e}")
            pass
        
        # Also save to Supabase as backup
        saved_to_db = False
        if self.supabase:
            try:
                self.supabase.table("agents").insert({
                    **agent_storage_data,
                    "api_key": agent_data.api_key  # Store API key in database only
                }).execute()
                saved_to_db = True
                # print(f"✅ Agent '{agent.display_name}' also saved to Supabase")
            except Exception as e:
                # print(f"⚠️  Error saving agent to Supabase: {e}")
                pass
        
        # Always store in memory as backup (even if saved to DB/Redis)
        AgentService._in_memory_agents[agent.id] = {
            **agent_storage_data,
            "api_key": agent_data.api_key
        }
        
        # if not saved_to_db and not self.supabase:
        #     print("⚠️  WARNING: Supabase not configured. Agent stored in memory only.")
        #     print("⚠️  Data will be lost on server restart. Please configure Supabase for persistence.")
        
        # Don't return API key in response
        agent.api_key = None
        return agent
    
    async def get_agent_chats(self, agent_id: str, wallet_address: Optional[str]) -> List[Chat]:
        """Get all chats for an agent from Redis"""
        chats = []
        
        # Try Redis first
        if cache_service.redis_available:
            try:
                # If wallet_address is provided, use the chat list index (faster)
                if wallet_address:
                    chat_ids = cache_service.get_chat_list(agent_id, wallet_address)
                else:
                    # If no wallet_address, we need to scan all chats for this agent
                    # This is less efficient but ensures we get all chats
                    chat_ids = []
                    # Try to get from a global agent chat list if it exists
                    all_chat_ids = cache_service.get(f"agent:chats:{agent_id}", [])
                    if all_chat_ids:
                        chat_ids = all_chat_ids
                
                # Load chats from Redis
                for chat_id in chat_ids:
                    # Get chat data
                    chat_data = cache_service.get_chat(chat_id)
                    if not chat_data:
                        continue
                    
                    # Check if it matches agent_id
                    if chat_data.get("agent_id") != agent_id:
                        continue
                    
                    # Filter by wallet_address if provided
                    if wallet_address and chat_data.get("user_wallet") != wallet_address:
                        continue
                    
                    # Get messages
                    messages_data = cache_service.get_messages(chat_id)
                    messages = []
                    for msg_data in messages_data:
                        # Convert timestamp string to datetime if needed
                        if isinstance(msg_data.get("timestamp"), str):
                            msg_data["timestamp"] = datetime.fromisoformat(msg_data["timestamp"])
                        # Convert role enum if it's a string
                        if isinstance(msg_data.get("role"), str):
                            from app.models.schemas import MessageRole
                            msg_data["role"] = MessageRole(msg_data["role"])
                        messages.append(Message(**msg_data))
                    
                    # Convert timestamp string to datetime if needed
                    if isinstance(chat_data.get("timestamp"), str):
                        chat_data["timestamp"] = datetime.fromisoformat(chat_data["timestamp"])
                    
                    chat_data["messages"] = messages
                    # Ensure web_search_enabled has a default value
                    if "web_search_enabled" not in chat_data:
                        chat_data["web_search_enabled"] = False
                    chats.append(Chat(**chat_data))
                
                # Sort by timestamp (newest first)
                chats.sort(key=lambda x: x.timestamp, reverse=True)
                return chats
            except Exception as e:
                # print(f"Error fetching chats from Redis: {e}")
                pass
        
        # If no wallet_address or Redis unavailable, fallback to in-memory storage
        for chat_id, chat_data in AgentService._in_memory_chats.items():
            if chat_data.get("agent_id") == agent_id:
                if not wallet_address or chat_data.get("user_wallet") == wallet_address:
                    # Get messages for this chat
                    chat_messages = []
                    for msg_data in AgentService._in_memory_messages.get(chat_id, []):
                        # Convert timestamp string to datetime if needed
                        if isinstance(msg_data.get("timestamp"), str):
                            msg_data["timestamp"] = datetime.fromisoformat(msg_data["timestamp"])
                        # Convert role enum if it's a string
                        if isinstance(msg_data.get("role"), str):
                            from app.models.schemas import MessageRole
                            msg_data["role"] = MessageRole(msg_data["role"])
                        chat_messages.append(Message(**msg_data))
                    chat_data["messages"] = chat_messages
                    # Ensure web_search_enabled has a default value
                    if "web_search_enabled" not in chat_data:
                        chat_data["web_search_enabled"] = False
                    chats.append(Chat(**chat_data))
        
        return chats
    
    async def create_chat(self, agent_id: str, chat_data: ChatCreate, wallet_address: str) -> Chat:
        """Create a new chat and save to Redis"""
        chat_id = str(uuid.uuid4())
        now = datetime.now()
        chat = Chat(
            id=chat_id,
            name=chat_data.name,
            memory_size=chat_data.memory_size,
            timestamp=now,
            message_count=0,
            messages=[],
            agent_id=agent_id,
            capsule_id=chat_data.capsule_id,
            user_wallet=wallet_address,
            web_search_enabled=getattr(chat_data, 'web_search_enabled', False)
        )
        
        chat_dict = {
            "id": chat.id,
            "name": chat.name,
            "memory_size": chat.memory_size.value,
            "timestamp": now.isoformat(),
            "message_count": 0,
            "agent_id": agent_id,
            "capsule_id": chat_data.capsule_id,
            "user_wallet": wallet_address,
            "last_message": None,
            "web_search_enabled": getattr(chat_data, 'web_search_enabled', False)
        }
        
        # Save to Redis (primary storage) - ALWAYS save, even if wallet_address is missing
        saved_to_redis = False
        if cache_service.redis_available:
            try:
                # Save chat data
                cache_service.save_chat(chat_dict)
                # Save empty messages list
                cache_service.save_messages(chat_id, [])
                
                # Add to chat list index (if wallet_address provided)
                if wallet_address:
                    cache_service.add_chat_to_list(agent_id, wallet_address, chat_id)
                
                # Also maintain a global agent chat list (for retrieval without wallet_address)
                agent_chat_list_key = f"agent:chats:{agent_id}"
                agent_chat_ids = cache_service.get(agent_chat_list_key, [])
                if chat_id not in agent_chat_ids:
                    agent_chat_ids.append(chat_id)
                    cache_service.set(agent_chat_list_key, agent_chat_ids, ttl_seconds=None)
                
                saved_to_redis = True
                # print(f"✅ Chat '{chat.name}' saved to Redis (agent: {agent_id}, wallet: {wallet_address or 'N/A'})")
            except Exception as e:
                # print(f"❌ Error saving chat to Redis: {e}")
                # import traceback
                # traceback.print_exc()
                pass
        
        # Always store in memory as backup
        AgentService._in_memory_chats[chat_id] = chat_dict
        AgentService._in_memory_messages[chat_id] = []
        
        # if not saved_to_redis:
        #     print("⚠️  WARNING: Redis not available. Chat stored in memory only.")
        #     print("⚠️  Data will be lost on server restart. Please configure Redis for persistence.")
        
        return chat
    
    async def get_chat(self, chat_id: str, wallet_address: Optional[str]) -> Optional[Chat]:
        """Get a specific chat with messages from Redis"""
        # Try Redis first
        if cache_service.redis_available:
            try:
                chat_data = cache_service.get_chat(chat_id)
                if chat_data:
                    # Check wallet address if provided
                    if wallet_address and chat_data.get("user_wallet") != wallet_address:
                        # print(f"Chat {chat_id} belongs to different wallet. Expected: {wallet_address}, Found: {chat_data.get('user_wallet')}")
                        return None
                    
                    # Get messages from Redis
                    messages_data = cache_service.get_messages(chat_id)
                    messages = []
                    for msg_data in messages_data:
                        # Convert timestamp string to datetime if needed
                        if isinstance(msg_data.get("timestamp"), str):
                            msg_data["timestamp"] = datetime.fromisoformat(msg_data["timestamp"])
                        # Convert role enum if it's a string
                        if isinstance(msg_data.get("role"), str):
                            from app.models.schemas import MessageRole
                            msg_data["role"] = MessageRole(msg_data["role"])
                        messages.append(Message(**msg_data))
                    
                    # Convert timestamp string to datetime if needed
                    if isinstance(chat_data.get("timestamp"), str):
                        chat_data["timestamp"] = datetime.fromisoformat(chat_data["timestamp"])
                    
                    chat_data["messages"] = messages
                    # Ensure web_search_enabled has a default value
                    if "web_search_enabled" not in chat_data:
                        chat_data["web_search_enabled"] = False
                    return Chat(**chat_data)
            except Exception as e:
                # print(f"Error fetching chat from Redis: {e}")
                pass
        
        # Fallback to in-memory storage
        if chat_id in AgentService._in_memory_chats:
            chat_data = AgentService._in_memory_chats[chat_id].copy()
            # Check wallet address if provided
            if wallet_address and chat_data.get("user_wallet") != wallet_address:
                # print(f"Chat {chat_id} in memory belongs to different wallet. Expected: {wallet_address}, Found: {chat_data.get('user_wallet')}")
                return None
            
            # Get messages from in-memory storage
            chat_messages = [
                Message(**msg) for msg in AgentService._in_memory_messages.get(chat_id, [])
            ]
            chat_data["messages"] = chat_messages
            # Ensure web_search_enabled has a default value
            if "web_search_enabled" not in chat_data:
                chat_data["web_search_enabled"] = False
            return Chat(**chat_data)
        
        # print(f"Chat {chat_id} not found in Redis or in-memory storage")
        return None
    
    async def update_chat(self, chat_id: str, chat_update: ChatUpdate, wallet_address: Optional[str]) -> Chat:
        """Update chat metadata in Redis"""
        # Get existing chat
        chat = await self.get_chat(chat_id, wallet_address)
        if not chat:
            raise Exception("Chat not found")
        
        # Update fields
        if chat_update.name:
            chat.name = chat_update.name
        if chat_update.memory_size:
            chat.memory_size = chat_update.memory_size
        
        # Save updated chat to Redis
        chat_dict = {
            "id": chat.id,
            "name": chat.name,
            "memory_size": chat.memory_size.value,
            "timestamp": chat.timestamp.isoformat() if isinstance(chat.timestamp, datetime) else chat.timestamp,
            "message_count": chat.message_count,
            "agent_id": chat.agent_id,
            "capsule_id": chat.capsule_id,
            "user_wallet": chat.user_wallet,
            "last_message": chat.last_message
        }
        
        if cache_service.redis_available:
            try:
                cache_service.save_chat(chat_dict)
                # print(f"✅ Chat '{chat.name}' updated in Redis")
            except Exception as e:
                # print(f"❌ Error updating chat in Redis: {e}")
                pass
        
        # Update in-memory storage
        AgentService._in_memory_chats[chat_id] = chat_dict
        
        return chat
    
    async def add_message(self, chat_id: str, message: MessageCreate, wallet_address: str) -> Message:
        """Add a message to a chat and save to Redis"""
        message_id = str(uuid.uuid4())
        now = datetime.now()
        msg = Message(
            id=message_id,
            role=message.role,
            content=message.content,
            timestamp=now
        )
        
        msg_dict = {
            "id": msg.id,
            "chat_id": chat_id,
            "role": msg.role.value,
            "content": msg.content,
            "timestamp": now.isoformat()
        }
        
        # Save to Redis (primary storage) - ALWAYS save
        if cache_service.redis_available:
            try:
                cache_service.add_message(chat_id, msg_dict)
                
                # Update chat message count and last message
                chat_data = cache_service.get_chat(chat_id)
                if chat_data:
                    messages = cache_service.get_messages(chat_id)
                    chat_data["message_count"] = len(messages)
                    chat_data["last_message"] = message.content[:100]
                    cache_service.save_chat(chat_data)
                    print(f"✅ Message saved to Redis (chat: {chat_id})")
                # else:
                #     print(f"⚠️  Chat {chat_id} not found in Redis, saving message anyway")
            except Exception as e:
                # print(f"❌ Error saving message to Redis: {e}")
                # import traceback
                # traceback.print_exc()
                # print("⚠️  Message stored in memory only")
                pass
        # else:
        #     print("⚠️  Redis not available, message stored in memory only")
        
        # Always store in memory as backup
        if chat_id not in AgentService._in_memory_messages:
            AgentService._in_memory_messages[chat_id] = []
        AgentService._in_memory_messages[chat_id].append(msg_dict)
        
        # Update in-memory chat
        if chat_id in AgentService._in_memory_chats:
            AgentService._in_memory_chats[chat_id]["message_count"] = len(AgentService._in_memory_messages[chat_id])
            AgentService._in_memory_chats[chat_id]["last_message"] = message.content[:100]
        
        return msg
    
    async def delete_chat(self, chat_id: str, wallet_address: Optional[str]):
        """Delete a chat and its messages from Redis, Supabase, and memory service"""
        # Get chat to find agent_id
        chat = await self.get_chat(chat_id, wallet_address)
        if not chat:
            # print(f"Chat {chat_id} not found")
            return
        
        agent_id = chat.agent_id
        
        # Delete memories associated with this chat
        from app.services.memory_service import MemoryService
        memory_service = MemoryService()
        try:
            memory_service.delete_chat_memories(agent_id, chat_id)
            # print(f"✅ Deleted memories for chat {chat_id}")
        except Exception as e:
            # print(f"⚠️  Error deleting memories for chat {chat_id}: {e}")
            pass
        
        # Delete from Supabase if available
        if self.supabase:
            try:
                # Delete messages first (CASCADE will handle this automatically, but explicit is clearer)
                self.supabase.table("messages").delete().eq("chat_id", chat_id).execute()
                # Delete chat
                self.supabase.table("chats").delete().eq("id", chat_id).execute()
                # print(f"✅ Chat {chat_id} deleted from Supabase")
            except Exception as e:
                # print(f"⚠️  Error deleting chat from Supabase: {e}")
                pass
        
        # Delete from Redis
        if cache_service.redis_available:
            try:
                cache_service.delete_chat(chat_id)
                cache_service.delete_messages(chat_id)
                if wallet_address:
                    cache_service.remove_chat_from_list(agent_id, wallet_address, chat_id)
                
                # Also remove from global agent chat list
                agent_chat_list_key = f"agent:chats:{agent_id}"
                agent_chat_ids = cache_service.get(agent_chat_list_key, [])
                if chat_id in agent_chat_ids:
                    agent_chat_ids.remove(chat_id)
                    cache_service.set(agent_chat_list_key, agent_chat_ids, ttl_seconds=None)
                
                # print(f"✅ Chat {chat_id} deleted from Redis")
            except Exception as e:
                # print(f"❌ Error deleting chat from Redis: {e}")
                pass
        
        # Delete from in-memory storage
        AgentService._in_memory_chats.pop(chat_id, None)
        AgentService._in_memory_messages.pop(chat_id, None)
    
    async def delete_agent(self, agent_id: str, wallet_address: str) -> bool:
        """Delete an agent/LLM configuration and all associated chats"""
        # Verify agent exists and belongs to user
        agent = await self.get_agent(agent_id, wallet_address)
        if not agent:
            raise Exception(f"Agent {agent_id} not found or unauthorized")
        
        # Delete all associated chats first (complete cleanup)
        # delete_chat already handles memory cleanup, so we just need to delete chats
        chats = await self.get_agent_chats(agent_id, wallet_address)
        
        # Delete all chats (delete_chat handles memory cleanup, Redis, Supabase, and in-memory)
        for chat in chats:
            try:
                await self.delete_chat(chat.id, wallet_address)
            except Exception as e:
                # print(f"⚠️  Error deleting chat {chat.id}: {e}")
                pass
        
        # Delete from Supabase
        if self.supabase:
            try:
                # Chats are already handled above, just delete agent
                self.supabase.table("agents").delete().eq("id", agent_id).eq("user_wallet", wallet_address).execute()
                # print(f"✅ Agent {agent_id} deleted from Supabase")
            except Exception as e:
                # print(f"⚠️  Error deleting agent from Supabase: {e}")
                pass
        
        # Delete from Redis
        if wallet_address and cache_service.redis_available:
            try:
                agents = cache_service.get_user_agents(wallet_address)
                agents = [a for a in agents if a.get("id") != agent_id]
                cache_service.set_user_agents(wallet_address, agents)
                # print(f"✅ Agent {agent_id} deleted from Redis")
            except Exception as e:
                # print(f"❌ Error deleting agent from Redis: {e}")
                pass
        
        # Delete from in-memory storage
        AgentService._in_memory_agents.pop(agent_id, None)
        
        return True

