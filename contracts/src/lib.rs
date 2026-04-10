#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

const MAX_PRICE_PER_QUERY: u64 = 100_000_000_000;
const MIN_PRICE_PER_QUERY: u64 = 100_000;
const MAX_STAKE_AMOUNT: u64 = 1_000_000_000_000;
const MIN_STAKE_AMOUNT: u64 = 1_000_000;
const LOCK_PERIOD_SECONDS: u64 = 7 * 24 * 60 * 60;

#[contracttype]
#[derive(Clone)]
pub struct Agent {
    pub owner: Address,
    pub agent_id: String,
    pub name: String,
    pub display_name: String,
    pub platform: String,
    pub created_at: u64,
    pub usage_count: u64,
    pub reputation: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Capsule {
    pub creator: Address,
    pub capsule_id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub price_per_query: u64,
    pub total_stake: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Staking {
    pub capsule_id: String,
    pub staker: Address,
    pub amount: u64,
    pub staked_at: u64,
    pub lock_until: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Earnings {
    pub wallet: Address,
    pub capsule_id: String,
    pub total_earnings: u64,
    pub query_count: u64,
    pub last_updated: u64,
}

#[contracttype]
pub enum DataKey {
    Agent(String),
    Capsule(String),
    Stake(String, Address),
    Earnings(String, Address),
}

#[contract]
pub struct AnymindContract;

#[contractimpl]
impl AnymindContract {
    pub fn register_agent(
        env: Env,
        owner: Address,
        agent_id: String,
        name: String,
        display_name: String,
        platform: String,
    ) {
        owner.require_auth();

        let now = env.ledger().timestamp();
        let agent = Agent {
            owner: owner.clone(),
            agent_id: agent_id.clone(),
            name,
            display_name,
            platform,
            created_at: now,
            usage_count: 0,
            reputation: 10000,
        };

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
    }

    pub fn create_capsule(
        env: Env,
        creator: Address,
        capsule_id: String,
        name: String,
        description: String,
        category: String,
        price_per_query: u64,
    ) {
        creator.require_auth();
        assert!(price_per_query >= MIN_PRICE_PER_QUERY);
        assert!(price_per_query <= MAX_PRICE_PER_QUERY);

        let now = env.ledger().timestamp();
        let capsule = Capsule {
            creator,
            capsule_id: capsule_id.clone(),
            name,
            description,
            category,
            price_per_query,
            total_stake: 0,
            created_at: now,
            updated_at: now,
        };

        env.storage().persistent().set(&DataKey::Capsule(capsule_id), &capsule);
    }

    pub fn stake_on_capsule(
        env: Env,
        staker: Address,
        capsule_id: String,
        amount: u64,
    ) {
        staker.require_auth();
        assert!(amount >= MIN_STAKE_AMOUNT);
        assert!(amount <= MAX_STAKE_AMOUNT);

        let key = DataKey::Capsule(capsule_id.clone());
        let mut capsule: Capsule = env.storage().persistent().get(&key).unwrap();
        let now = env.ledger().timestamp();

        let stake = Staking {
            capsule_id: capsule_id.clone(),
            staker: staker.clone(),
            amount,
            staked_at: now,
            lock_until: now + LOCK_PERIOD_SECONDS,
        };

        capsule.total_stake += amount;
        capsule.updated_at = now;

        env.storage().persistent().set(&key, &capsule);
        env.storage()
            .persistent()
            .set(&DataKey::Stake(capsule_id, staker), &stake);
    }

    pub fn update_capsule_price(
        env: Env,
        creator: Address,
        capsule_id: String,
        new_price: u64,
    ) {
        creator.require_auth();
        assert!(new_price >= MIN_PRICE_PER_QUERY);
        assert!(new_price <= MAX_PRICE_PER_QUERY);

        let key = DataKey::Capsule(capsule_id);
        let mut capsule: Capsule = env.storage().persistent().get(&key).unwrap();
        creator.require_auth();
        assert!(capsule.creator == creator);

        capsule.price_per_query = new_price;
        capsule.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &capsule);
    }

    pub fn withdraw_earnings(
        env: Env,
        creator: Address,
        capsule_id: String,
    ) -> u64 {
        creator.require_auth();

        let key = DataKey::Earnings(capsule_id.clone(), creator.clone());
        let mut earnings: Earnings = env.storage().persistent().get(&key).unwrap();
        let amount = earnings.total_earnings;

        earnings.total_earnings = 0;
        earnings.last_updated = env.ledger().timestamp();
        env.storage().persistent().set(&key, &earnings);

        amount
    }
}
