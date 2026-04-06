from .client import SolmindClient
from .types import ChatResponse


class Agent:
    """
    Read-only execution handle for a persistent agent capsule.

    - agent_id: persistent agent identity
    - chat_id: strict capsule scope
    - wallet_address: Solana wallet address for authentication
    """

    def __init__(
        self,
        agent_id: str,
        chat_id: str,
        wallet_address: str,
        base_url: str = "http://localhost:8000",
    ):
        self.agent_id = agent_id
        self.chat_id = chat_id
        self.client = SolmindClient(wallet_address, base_url)

    def chat(self, message: str) -> str:
        """
        Sends a message to the agent and returns the response.
        The message is saved to chat history and memory is updated.
        """

        payload = {
            "role": "user",
            "content": message,
        }

        endpoint = f"/api/v1/agents/{self.agent_id}/chats/{self.chat_id}/messages"
        result: ChatResponse = self.client.post(endpoint, payload)
        return result["content"]

