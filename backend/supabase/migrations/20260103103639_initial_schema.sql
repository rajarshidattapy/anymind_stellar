-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  api_key_configured BOOLEAN DEFAULT false,
  model TEXT,
  user_wallet TEXT,
  api_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_user_wallet ON agents(user_wallet);
CREATE INDEX IF NOT EXISTS idx_agents_platform ON agents(platform);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  memory_size TEXT NOT NULL,
  last_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  agent_id TEXT,
  user_wallet TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- Add timestamp column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE chats ADD COLUMN timestamp TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chats_agent_id ON chats(agent_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_wallet ON chats(user_wallet);
CREATE INDEX IF NOT EXISTS idx_chats_timestamp ON chats(timestamp DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Add timestamp column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE messages ADD COLUMN timestamp TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- Capsules table
CREATE TABLE IF NOT EXISTS capsules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  creator_wallet TEXT NOT NULL,
  price_per_query NUMERIC DEFAULT 0,
  stake_amount NUMERIC DEFAULT 0,
  reputation NUMERIC DEFAULT 0,
  query_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_capsules_creator_wallet ON capsules(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_capsules_category ON capsules(category);
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capsules_query_count ON capsules(query_count DESC);
CREATE INDEX IF NOT EXISTS idx_capsules_rating ON capsules(rating DESC);
CREATE INDEX IF NOT EXISTS idx_capsules_reputation ON capsules(reputation DESC);

-- Staking table
CREATE TABLE IF NOT EXISTS staking (
  id SERIAL PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  stake_amount NUMERIC NOT NULL,
  staked_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

-- Add staked_at column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staking' AND column_name = 'staked_at'
  ) THEN
    ALTER TABLE staking ADD COLUMN staked_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_staking_capsule_id ON staking(capsule_id);
CREATE INDEX IF NOT EXISTS idx_staking_wallet_address ON staking(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staking_staked_at ON staking(staked_at DESC);

-- Earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  capsule_id TEXT,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE SET NULL
);

-- Add created_at column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'earnings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE earnings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_earnings_wallet_address ON earnings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_earnings_capsule_id ON earnings(capsule_id);
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at DESC);

-- Function to increment stake
CREATE OR REPLACE FUNCTION increment_stake(
  capsule_id_param TEXT,
  amount_param NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE capsules
  SET stake_amount = stake_amount + amount_param,
      updated_at = NOW()
  WHERE id = capsule_id_param;
END;
$$ LANGUAGE plpgsql;

