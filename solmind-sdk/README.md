# SolMind Python SDK

Python SDK for interacting with the SolMind API.

## Installation

Install the package in development mode:

```bash
pip install -e .
```

Or install it normally:

```bash
pip install .
```

## Usage

```python
from solmind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="your-agent-id",
    chat_id="your-chat-id",
    wallet_address="YourSolanaWalletAddress",
    base_url="http://localhost:8000"  # Optional: defaults to localhost:8000
)

# Send a message to the agent
response = agent.chat("Your message here")
print(response)
```

## Requirements

- Python 3.8+
- requests>=2.31.0

