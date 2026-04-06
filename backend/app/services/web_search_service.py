import os
from typing import Optional
from dotenv import load_dotenv
from tavily import TavilyClient
import logging

load_dotenv()

logger = logging.getLogger(__name__)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Initialize Tavily client
tavily_client = None
if TAVILY_API_KEY:
    try:
        tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        logger.info("Tavily client initialized successfully")
    except Exception as e:
        # logger.warning(f"Failed to initialize Tavily client: {e}")
        pass
# else:
#     logger.warning("TAVILY_API_KEY not found in environment variables")


def web_search(query: str, k: int = 5) -> str:
    """
    Perform web search using Tavily API.
    
    Args:
        query: Search query string
        k: Number of results to return (default: 5)
    
    Returns:
        Formatted string with search results
    """
    if not tavily_client:
        # logger.warning("Tavily client not available, web search disabled")
        return ""
    
    try:
        res = tavily_client.search(
            query=query,
            max_results=k,
            include_answer=False,
            include_raw_content=False,
        )
        
        docs = []
        for r in res.get("results", []):
            docs.append(
                f"- {r['title']} ({r['url']}): {r['content']}"
            )
        return "\n".join(docs) if docs else ""
    except Exception as e:
        # logger.error(f"Error performing web search: {e}")
        return ""


def is_available() -> bool:
    """Check if web search is available (Tavily API key configured)"""
    return tavily_client is not None

