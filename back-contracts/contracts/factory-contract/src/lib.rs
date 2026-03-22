#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, vec, Address, BytesN, Env, IntoVal,
    String, Val, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    BatchWasmHash,
    BatchAddress(String),
    Count,
    AddressByIndex(u32),
}

#[contractevent(topics = ["batch_deployed"])]
pub struct BatchDeployedEvent {
    pub batch_id: String,
    pub contract_address: Address,
}

#[contract]
pub struct FactoryContract;

#[contractimpl]
impl FactoryContract {
    pub fn __constructor(env: Env, admin: Address, batch_wasm_hash: BytesN<32>) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::BatchWasmHash, &batch_wasm_hash);
        env.storage().instance().set(&DataKey::Count, &0u32);
    }

    pub fn create_batch(
        env: Env,
        batch_id: String,
        producer: Address,
        initial_photo_hash: BytesN<32>,
        initial_checkpoint_data_ref: String,
        initial_timestamp: u64,
        initial_location_hash: BytesN<32>,
    ) -> Address {
        let admin = get_admin(&env);
        admin.require_auth();

        if let Some(existing) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::BatchAddress(batch_id.clone()))
        {
            return existing;
        }

        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let mut salt_bytes = [0u8; 32];
        let count_bytes = count.to_be_bytes();
        salt_bytes[28] = count_bytes[0];
        salt_bytes[29] = count_bytes[1];
        salt_bytes[30] = count_bytes[2];
        salt_bytes[31] = count_bytes[3];
        let salt = BytesN::from_array(&env, &salt_bytes);
        let batch_wasm_hash = get_batch_wasm_hash(&env);
        let constructor_args: Vec<Val> = vec![
            &env,
            env.current_contract_address().into_val(&env),
            batch_id.clone().into_val(&env),
            producer.into_val(&env),
            initial_photo_hash.into_val(&env),
            initial_timestamp.into_val(&env),
            initial_location_hash.into_val(&env),
            initial_checkpoint_data_ref.into_val(&env),
            salt.clone().into_val(&env),
        ];

        let address = env
            .deployer()
            .with_address(env.current_contract_address(), salt)
            .deploy_v2(batch_wasm_hash, constructor_args);

        env.storage()
            .persistent()
            .set(&DataKey::BatchAddress(batch_id.clone()), &address);

        env.storage()
            .persistent()
            .set(&DataKey::AddressByIndex(count), &address);
        env.storage().instance().set(&DataKey::Count, &(count + 1));

        BatchDeployedEvent {
            batch_id,
            contract_address: address.clone(),
        }
        .publish(&env);

        address
    }

    pub fn get_batch_address(env: Env, batch_id: String) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::BatchAddress(batch_id))
    }

    pub fn list_batches(env: Env) -> Vec<Address> {
        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let mut addresses = Vec::new(&env);

        for index in 0..count {
            if let Some(address) = env
                .storage()
                .persistent()
                .get::<DataKey, Address>(&DataKey::AddressByIndex(index))
            {
                addresses.push_back(address);
            }
        }

        addresses
    }
}

fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

fn get_batch_wasm_hash(env: &Env) -> BytesN<32> {
    env.storage()
        .instance()
        .get(&DataKey::BatchWasmHash)
        .unwrap()
}
