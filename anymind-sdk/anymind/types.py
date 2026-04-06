from typing import TypedDict, Optional, Dict, Any


class ChatResponse(TypedDict):
    content: str
    model: str
    usage: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]

