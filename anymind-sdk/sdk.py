from anymind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="custom-fd3d5329",
    chat_id="c5b4f20a-e387-4068-8815-80cdc1da618d",
    wallet_address="GBRPYHIL2C2A7L3S37JQZKJQBTQUL4H2WQX4J4S6CGN2VZ5F3M6V4T6D",
    base_url="https://anymind-stellar.onrender.com"  # Optional: defaults to localhost:8000
)

# Send a message to the agent
# The message is saved to chat history and memory is automatically updated
response = agent.chat("Analyze this chat")

print(response)
