from typing import List, Dict, Optional, AsyncGenerator
from app.core.config import settings
from app.models.schemas import Agent, LLMResponse
from app.services.memory_service import MemoryService
from app.services.web_search_service import web_search, is_available as web_search_available

import httpx
import json
import logging

logger = logging.getLogger(__name__)


def truncate_to_words(text: str, max_words: int = 100) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."


class LLMService:
    def __init__(self):
        self.openrouter_base = "https://openrouter.ai/api/v1"
        self.memory_service = MemoryService()

    # ---------------------------------------------------------------------
    # PUBLIC NON-STREAM API
    # ---------------------------------------------------------------------

    async def get_completion(
        self,
        agent_id: str,
        messages: List[Dict[str, str]],
        agent_config: Agent,
        chat_id: Optional[str] = None,
        memory_size: str = "Medium",
        capsule_id: Optional[str] = None,
        web_search_enabled: bool = False
    ) -> LLMResponse:
        """
        Get a single completion (non-streaming).
        Collects the full response from the stream and returns it as LLMResponse.
        """
        full_content = ""
        model_name = agent_config.model or "google/gemma-3-27b-it:free"
        
        # Get memory context
        memory_context = ""
        if chat_id and self.memory_service._is_available():
            try:
                user_message = messages[-1]["content"] if messages else ""
                memories = self.memory_service.get_chat_memories(
                    agent_id=agent_id,
                    chat_id=chat_id,
                    query=user_message,
                    memory_size=memory_size,
                    capsule_id=capsule_id
                )
                memory_context = self.memory_service.format_memory_context(memories)
            except Exception as e:
                # logger.warning(f"Memory retrieval failed: {e}")
                pass

        # Get web search context if enabled
        web_search_context = ""
        if web_search_enabled and web_search_available():
            try:
                user_message = messages[-1]["content"] if messages else ""
                if user_message:
                    logger.info(f"🔎 Performing web search for: {user_message[:50]}...")
                    web_search_context = web_search(user_message, k=5)
                    if web_search_context:
                        logger.info("✅ Web search completed successfully")
            except Exception as e:
                # logger.warning(f"Web search failed: {e}")
                pass

        enhanced_messages = self._inject_system_prompt(messages, memory_context, web_search_context)
        
        # Collect all chunks from the stream
        async for chunk in self._stream_completion(
            enhanced_messages,
            agent_config,
            agent_id
        ):
            full_content += chunk

        # Store memory after getting full response
        if chat_id and self.memory_service._is_available():
            try:
                self.memory_service.store_chat_memory(
                    agent_id=agent_id,
                    chat_id=chat_id,
                    messages=messages + [{"role": "assistant", "content": full_content}],
                    capsule_id=capsule_id
                )
            except Exception as e:
                # logger.warning(f"Memory storage failed: {e}")
                pass

        return LLMResponse(
            content=full_content,
            model=model_name,
            usage=None,
            metadata=None
        )

    # ---------------------------------------------------------------------
    # PUBLIC STREAM API
    # ---------------------------------------------------------------------

    async def get_completion_stream(
        self,
        agent_id: str,
        messages: List[Dict[str, str]],
        agent_config: Agent,
        chat_id: Optional[str] = None,
        memory_size: str = "Medium",
        capsule_id: Optional[str] = None,
        web_search_enabled: bool = False
    ) -> AsyncGenerator[str, None]:

        memory_context = ""
        if chat_id and self.memory_service._is_available():
            try:
                user_message = messages[-1]["content"] if messages else ""
                memories = self.memory_service.get_chat_memories(
                    agent_id=agent_id,
                    chat_id=chat_id,
                    query=user_message,
                    memory_size=memory_size,
                    capsule_id=capsule_id
                )
                memory_context = self.memory_service.format_memory_context(memories)
            except Exception as e:
                # logger.warning(f"Memory retrieval failed: {e}")
                pass

        # Get web search context if enabled
        web_search_context = ""
        if web_search_enabled and web_search_available():
            try:
                user_message = messages[-1]["content"] if messages else ""
                if user_message:
                    logger.info(f"🔎 Performing web search for: {user_message[:50]}...")
                    web_search_context = web_search(user_message, k=5)
                    if web_search_context:
                        logger.info("✅ Web search completed successfully")
            except Exception as e:
                # logger.warning(f"Web search failed: {e}")
                pass

        enhanced_messages = self._inject_system_prompt(messages, memory_context, web_search_context)

        full_content = ""
        async for chunk in self._stream_completion(
            enhanced_messages,
            agent_config,
            agent_id
        ):
            full_content += chunk
            yield chunk

        if chat_id and self.memory_service._is_available():
            try:
                self.memory_service.store_chat_memory(
                    agent_id=agent_id,
                    chat_id=chat_id,
                    messages=messages + [{"role": "assistant", "content": full_content}],
                    capsule_id=capsule_id
                )
            except Exception as e:
                # logger.warning(f"Memory storage failed: {e}")
                pass

    # ---------------------------------------------------------------------
    # SINGLE STREAM ROUTER (THE FIX)
    # ---------------------------------------------------------------------

    async def _stream_completion(
        self,
        messages: List[Dict[str, str]],
        agent_config: Agent,
        agent_id: str
    ) -> AsyncGenerator[str, None]:

        platform = agent_config.platform.lower()
        model = agent_config.model
        api_key = agent_config.api_key

        # 🔥 Canonical provider resolution
        if (
            platform == "openrouter"
            or "openrouter" in platform
            or agent_id in {"gpt", "mistral"}
        ):
            provider = "openrouter"
        else:
            provider = "openrouter"  # default fallback to openrouter

        async for chunk in self._provider_stream(
            provider,
            messages,
            model,
            api_key
        ):
            yield chunk

    # ---------------------------------------------------------------------
    # PROVIDER STREAM IMPLEMENTATIONS
    # ---------------------------------------------------------------------

    async def _provider_stream(
        self,
        provider: str,
        messages: List[Dict[str, str]],
        model: Optional[str],
        api_key: Optional[str]
    ) -> AsyncGenerator[str, None]:

        if provider == "openrouter":
            async for c in self._openrouter_stream(messages, model, api_key):
                yield c
        else:
            # Default to openrouter for all providers
            async for c in self._openrouter_stream(messages, model, api_key):
                yield c

    # ---------------------------------------------------------------------
    # PROVIDER-SPECIFIC STREAMS (MINIMAL, CLEAN)
    # ---------------------------------------------------------------------

    async def _openrouter_stream(self, messages, model, api_key):
        model = model or "openai/gpt-4-turbo"
        api_key = api_key or settings.OPENROUTER_API_KEY

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.openrouter_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://solmind.ai",
                    "X-Title": "SolMind"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True
                },
                timeout=60
            ) as response:

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        payload = json.loads(data)
                        delta = payload["choices"][0].get("delta", {})
                        if content := delta.get("content"):
                            yield content

    # ---------------------------------------------------------------------

    def _inject_system_prompt(self, messages, memory_context="", web_search_context=""):
        system_prompt = "You are a helpful assistant. Please keep your responses concise and aim for approximately 100 words. Complete your thoughts naturally within this limit."
        
        if web_search_context:
            system_prompt += "\n\nYou are a web-enabled research assistant. Use the following web results to answer the question accurately. Do NOT hallucinate. Base answers strictly on the data provided.\n\nWeb results:\n" + web_search_context
        
        if memory_context:
            system_prompt += f"\n\nRelevant context from memory:\n{memory_context}"

        if any(m["role"] == "system" for m in messages):
            for m in messages:
                if m["role"] == "system":
                    m["content"] += "\n\nPlease keep your responses concise and aim for approximately 100 words. Complete your thoughts naturally within this limit."
                    if web_search_context:
                        m["content"] += "\n\nYou are a web-enabled research assistant. Use the following web results to answer the question accurately. Do NOT hallucinate. Base answers strictly on the data provided.\n\nWeb results:\n" + web_search_context
                    if memory_context:
                        m["content"] += f"\n\nRelevant context from memory:\n{memory_context}"
            return messages

        return [{"role": "system", "content": system_prompt}] + messages
