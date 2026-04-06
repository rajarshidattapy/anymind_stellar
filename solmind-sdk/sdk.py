from solmind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="custom-fd3d5329",
    chat_id="c5b4f20a-e387-4068-8815-80cdc1da618d",
    wallet_address="AmfxkopBWbsF5qgQDCica6jGQ3NyMDhcLqcoRFzJodfJ",
    base_url="https://sol-mind.onrender.com"  # Optional: defaults to localhost:8000
)

# Send a message to the agent
# The message is saved to chat history and memory is automatically updated
response = agent.chat("Analyze this chat")

print(response)