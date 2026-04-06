from typing import List, Dict, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import MemoryClient (Platform API) first, fallback to Memory (open-source)
MEM0_PLATFORM_AVAILABLE = False
Memory = None
MemoryClient = None
_import_error = None

try:
    from mem0 import MemoryClient
    MEM0_PLATFORM_AVAILABLE = True
    # logger.debug("✅ MemoryClient import successful")
except (ImportError, ModuleNotFoundError) as e:
    MEM0_PLATFORM_AVAILABLE = False
    _import_error = str(e)
    # logger.debug(f"MemoryClient import failed: {type(e).__name__}: {e}")
    try:
        from mem0 import Memory
        # logger.debug("✅ Memory (open-source) import successful")
    except (ImportError, ModuleNotFoundError) as e2:
        Memory = None
        # logger.debug(f"Memory import also failed: {type(e2).__name__}: {e2}")
except Exception as e:
    # Catch any other unexpected errors during import
    MEM0_PLATFORM_AVAILABLE = False
    _import_error = str(e)
    # logger.warning(f"Unexpected error importing MemoryClient: {type(e).__name__}: {e}")
    try:
        from mem0 import Memory
        # logger.debug("✅ Memory (open-source) import successful")
    except Exception as e2:
        Memory = None
        # logger.debug(f"Memory import also failed: {type(e2).__name__}: {e2}")

class MemoryService:
    """
    Service for managing semantic memory using mem0
    
    Handles:
    - Retrieving relevant memories for a chat
    - Storing new memories from conversations
    - Per-chat memory isolation
    - Memory size configuration
    - Memory tracking and verification
    
    Supports both:
    - Mem0 Platform (hosted) via MemoryClient with MEM0_API_KEY
    - Open-source mem0 with local ChromaDB (fallback)
    """
    
    def __init__(self):
        """Initialize mem0 - prefer Platform API, fallback to open-source"""
        self.memory = None
        self.use_platform = False
        
        # Try Mem0 Platform first (if API key is provided and import succeeded)
        if settings.MEM0_API_KEY and MEM0_PLATFORM_AVAILABLE:
            try:
                self.memory = MemoryClient(api_key=settings.MEM0_API_KEY)
                self.use_platform = True
                # logger.info("✅ MemoryService initialized with Mem0 Platform API")
                # logger.info(f"   Using hosted memory service (trackable via Mem0 dashboard)")
            except NameError as e:
                # logger.error(f"MemoryClient not available (import may have failed): {e}")
                # logger.warning("Falling back to open-source mem0...")
                pass
            except Exception as e:
                # logger.error(f"Failed to initialize Mem0 Platform: {e}")
                # logger.warning("Falling back to open-source mem0...")
                pass
        elif settings.MEM0_API_KEY and not MEM0_PLATFORM_AVAILABLE:
            # logger.warning("MEM0_API_KEY is set but MemoryClient import failed - falling back to open-source mem0...")
            # if _import_error:
            #     logger.warning(f"   Import error: {_import_error}")
            # logger.warning("   💡 To fix: Stop uvicorn, then run: pip install --upgrade mem0ai")
            # logger.warning("   The mem0ai package may need to be reinstalled (current version may be a placeholder)")
            pass
        
        # Fallback to open-source mem0 with local ChromaDB
        if not self.memory and Memory is not None:
            try:
                # Build config with vector store
                config = {
                    "vector_store": {
                        "provider": "chroma",
                        "config": {
                            "collection_name": "solmind_memory",
                            "path": "./.chroma_db"  # Local storage
                        }
                    }
                }
                
                self.memory = Memory.from_config(config)
                # logger.info("✅ MemoryService initialized with open-source mem0 (ChromaDB)")
                # logger.warning("⚠️  Using local storage - memories not trackable via Mem0 dashboard")
            except Exception as e:
                # logger.error(f"Failed to initialize open-source mem0: {e}")
                self.memory = None
        
        if not self.memory:
            # logger.error("❌ MemoryService initialization failed - memory features disabled")
            # if settings.MEM0_API_KEY:
            #     logger.error("   MEM0_API_KEY is set but mem0 package is not available")
            #     logger.error("   💡 Solution: Stop uvicorn server, then run:")
            #     logger.error("      pip uninstall mem0ai -y")
            #     logger.error("      pip install mem0ai")
            #     logger.error("   Then restart uvicorn")
            # else:
            #     logger.warning("   Set MEM0_API_KEY for Platform API, or ensure mem0ai package is installed for open-source mode")
            pass
    
    def _is_available(self) -> bool:
        """Check if memory service is available"""
        return self.memory is not None
    
    def get_chat_memories(
        self,
        agent_id: str,
        chat_id: str,
        query: str,
        memory_size: str = "Medium",
        limit: Optional[int] = None,
        capsule_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Retrieve relevant memories for a chat (scoped by capsule if provided)
        
        Args:
            agent_id: Agent identifier (used as user_id in mem0)
            chat_id: Chat identifier (stored in metadata)
            query: Search query (usually the user's message)
            memory_size: Memory size setting ('Small', 'Medium', 'Large')
            limit: Optional override for memory limit
            capsule_id: Optional capsule ID for memory isolation
        
        Returns:
            List of memory dictionaries with 'memory' and 'metadata' keys
        """
        if not self._is_available():
            # logger.warning("Memory service not available, returning empty memories")
            return []
        
        # Map memory_size to limit
        if limit is None:
            limits = {
                "Small": 3,
                "Medium": 5,
                "Large": 10
            }
            limit = limits.get(memory_size, 5)
        
        try:
            # Build metadata with capsule scope for isolation
            metadata = {"chat_id": chat_id, "agent_id": agent_id}
            if capsule_id:
                metadata["capsule_id"] = capsule_id
            
            memories = self.memory.search(
                query=query,
                user_id=agent_id,
                metadata=metadata,
                limit=limit
            )
            
            scope_info = f" (capsule: {capsule_id})" if capsule_id else ""
            # logger.info(f"🔍 Retrieved {len(memories)} memories for chat {chat_id}{scope_info} (query: '{query[:50]}...')")
            # if memories:
            #     logger.debug(f"   Memory preview: {memories[0].get('memory', '')[:100]}...")
            return memories
        except Exception as e:
            # logger.error(f"❌ Error retrieving memories for chat {chat_id}: {e}")
            return []  # Fallback to empty list
    
    def store_chat_memory(
        self,
        agent_id: str,
        chat_id: str,
        messages: List[Dict[str, str]],
        capsule_id: Optional[str] = None
    ) -> bool:
        """
        Store new memory from conversation (scoped by capsule if provided)
        
        Args:
            agent_id: Agent identifier (used as user_id in mem0)
            chat_id: Chat identifier (stored in metadata)
            messages: List of message dicts with 'role' and 'content' keys
            capsule_id: Optional capsule ID for memory isolation
        
        Returns:
            True if memory was stored successfully, False otherwise
        """
        if not self._is_available():
            # logger.warning("Memory service not available, skipping memory storage")
            return False
        
        if not messages or len(messages) < 2:
            # logger.warning(f"Not enough messages to store memory (got {len(messages) if messages else 0})")
            return False
        
        try:
            # Prepare metadata with chat_id and capsule_id for scope isolation
            metadata = {"chat_id": chat_id, "agent_id": agent_id}
            if capsule_id:
                metadata["capsule_id"] = capsule_id
            
            # Store memory
            result = self.memory.add(
                messages=messages,
                user_id=agent_id,
                metadata=metadata
            )
            
            # Enhanced logging for tracking
            scope_info = f" (capsule: {capsule_id})" if capsule_id else ""
            logger.info(f"✅ Memory stored successfully for chat {chat_id} (agent: {agent_id}){scope_info}")
            if self.use_platform:
                logger.info(f"   📊 Track this memory in Mem0 dashboard: https://app.mem0.ai")
            if result:
                # Log memory details if available
                if isinstance(result, dict):
                    memory_id = result.get("id") or result.get("memory_id")
                    # if memory_id:
                    #     logger.debug(f"   Memory ID: {memory_id}")
            
            return True
        except Exception as e:
            # logger.error(f"❌ Error storing memory for chat {chat_id}: {e}")
            # logger.error(f"   Agent: {agent_id}, Messages: {len(messages)}")
            return False
    
    def format_memory_context(self, memories: List[Dict]) -> str:
        """
        Format memories into a context string for LLM prompts
        
        Args:
            memories: List of memory dictionaries from get_chat_memories
        
        Returns:
            Formatted string with memory context
        """
        if not memories:
            return ""
        
        memory_lines = []
        for mem in memories:
            memory_text = mem.get("memory", "")
            if memory_text:
                memory_lines.append(f"- {memory_text}")
        
        if memory_lines:
            return "\n".join(memory_lines)
        return ""
    
    def get_all_chat_memories(
        self,
        agent_id: str,
        chat_id: str,
        capsule_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Get all memories for a specific chat (for verification/tracking)
        
        Args:
            agent_id: Agent identifier
            chat_id: Chat identifier
            capsule_id: Optional capsule ID for filtering
        
        Returns:
            List of all memory dictionaries for this chat
        """
        if not self._is_available():
            logger.warning("Memory service not available")
            return []
        
        try:
            if self.use_platform:
                # Use Platform API's get_all with filters (include capsule_id if provided)
                filters = {"user_id": agent_id, "chat_id": chat_id}
                if capsule_id:
                    filters["capsule_id"] = capsule_id
                memories = self.memory.get_all(
                    filters=filters
                )
            else:
                # For open-source, search with a broad query (filtered by capsule if provided)
                metadata = {"chat_id": chat_id, "agent_id": agent_id}
                if capsule_id:
                    metadata["capsule_id"] = capsule_id
                memories = self.memory.search(
                    query="",
                    user_id=agent_id,
                    metadata=metadata,
                    limit=100  # Get up to 100 memories
                )
            
            # logger.info(f"📋 Found {len(memories)} total memories for chat {chat_id}")
            return memories
        except Exception as e:
            # logger.error(f"Error getting all memories for chat {chat_id}: {e}")
            return []
    
    def delete_chat_memories(
        self,
        agent_id: str,
        chat_id: str
    ) -> bool:
        """
        Delete all memories for a specific chat
        
        Args:
            agent_id: Agent identifier
            chat_id: Chat identifier
        
        Returns:
            True if deletion was successful, False otherwise
        """
        if not self._is_available():
            # logger.warning("Memory service not available, cannot delete memories")
            return False
        
        try:
            if self.use_platform:
                # Platform API supports delete with filters
                result = self.memory.delete(
                    filters={"user_id": agent_id, "chat_id": chat_id}
                )
                # logger.info(f"✅ Deleted memories for chat {chat_id}")
                return True
            else:
                # For open-source, this is more complex
                # logger.warning(f"Delete by metadata not fully supported in open-source mem0 for chat {chat_id}")
                return False
        except Exception as e:
            # logger.error(f"Error deleting memories for chat {chat_id}: {e}")
            return False

