import requests
from .errors import AuthenticationError, SolmindRuntimeError


class SolmindClient:
    def __init__(self, wallet_address: str, base_url: str):
        self.wallet_address = wallet_address
        self.base_url = base_url.rstrip("/")

    def post(self, path: str, payload: dict) -> dict:
        resp = requests.post(
            f"{self.base_url}{path}",
            json=payload,
            headers={
                "X-Wallet-Address": self.wallet_address,
                "Content-Type": "application/json",
            },
            timeout=30,
        )

        if resp.status_code == 401:
            raise AuthenticationError("Wallet address required or invalid")

        if resp.status_code == 404:
            raise SolmindRuntimeError(f"Resource not found: {resp.text}")

        if resp.status_code != 200:
            raise SolmindRuntimeError(f"API error ({resp.status_code}): {resp.text}")

        return resp.json()

