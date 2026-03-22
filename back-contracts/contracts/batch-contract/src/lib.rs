#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Role {
    Producer,
    Transporter,
    Inspector,
    Distributor,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BatchStatus {
    Harvested,
    InTransit,
    Inspected,
    Delivered,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Checkpoint {
    pub actor: Address,
    pub role: Role,
    pub photo_hash: BytesN<32>,
    pub timestamp: u64,
    pub location_hash: BytesN<32>,
    pub status: BatchStatus,
    pub db_ref: String,
    pub tx_hash: BytesN<32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchSummary {
    pub batch_id: String,
    pub admin: Address,
    pub producer: Address,
    pub status: BatchStatus,
    pub current_role: Role,
    pub total_checkpoints: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    BatchId,
    Producer,
    Status,
    CurrentRole,
    CheckpointCount,
    Checkpoint(u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    InvalidRoleTransition = 1,
    BatchClosed = 2,
    InvalidCheckpointCount = 3,
}

#[contractevent(topics = ["batch_created"])]
pub struct BatchCreatedEvent {
    pub batch_id: String,
    pub producer: Address,
}

#[contractevent(topics = ["checkpoint_added"])]
pub struct CheckpointAddedEvent {
    pub batch_id: String,
    pub role: Role,
    pub status: BatchStatus,
}

#[contractevent(topics = ["batch_closed"])]
pub struct BatchClosedEvent {
    pub batch_id: String,
    pub status: BatchStatus,
}

#[contract]
pub struct BatchContract;

#[contractimpl]
impl BatchContract {
    #[allow(clippy::too_many_arguments)]
    pub fn __constructor(
        env: Env,
        admin: Address,
        batch_id: String,
        producer: Address,
        initial_photo_hash: BytesN<32>,
        initial_timestamp: u64,
        initial_location_hash: BytesN<32>,
        initial_db_ref: String,
        initial_tx_hash: BytesN<32>,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BatchId, &batch_id);
        env.storage().instance().set(&DataKey::Producer, &producer);
        env.storage()
            .instance()
            .set(&DataKey::Status, &BatchStatus::Harvested);
        env.storage()
            .instance()
            .set(&DataKey::CurrentRole, &Role::Producer);
        env.storage().instance().set(&DataKey::CheckpointCount, &1u32);

        let checkpoint = Checkpoint {
            actor: producer.clone(),
            role: Role::Producer,
            photo_hash: initial_photo_hash,
            timestamp: initial_timestamp,
            location_hash: initial_location_hash,
            status: BatchStatus::Harvested,
            db_ref: initial_db_ref,
            tx_hash: initial_tx_hash,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Checkpoint(0), &checkpoint);
        extend_ttl(&env, &DataKey::Checkpoint(0));

        BatchCreatedEvent {
            batch_id,
            producer,
        }
        .publish(&env);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn add_checkpoint(
        env: Env,
        actor: Address,
        role_code: String,
        photo_hash: BytesN<32>,
        timestamp: u64,
        location_hash: BytesN<32>,
        status_code: String,
        db_ref: String,
        tx_hash: BytesN<32>,
    ) -> Result<u32, ContractError> {
        require_admin(&env);

        let current_status = get_status(&env);
        if current_status == BatchStatus::Closed {
            return Err(ContractError::BatchClosed);
        }

        let current_role = get_current_role(&env);
        let role = parse_role(&env, &role_code)?;
        let status = parse_status(&env, &status_code)?;
        if !is_valid_transition(&current_role, &role) {
            return Err(ContractError::InvalidRoleTransition);
        }

        let checkpoint_count = get_checkpoint_count(&env)?;
        let checkpoint = Checkpoint {
            actor,
            role: role.clone(),
            photo_hash,
            timestamp,
            location_hash,
            status: status.clone(),
            db_ref,
            tx_hash,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Checkpoint(checkpoint_count), &checkpoint);
        env.storage()
            .instance()
            .set(&DataKey::CheckpointCount, &(checkpoint_count + 1));
        env.storage().instance().set(&DataKey::CurrentRole, &role);
        env.storage().instance().set(&DataKey::Status, &status);

        extend_ttl(&env, &DataKey::Checkpoint(checkpoint_count));
        extend_instance_ttl(&env);

        let batch_id = get_batch_id(&env);
        CheckpointAddedEvent {
            batch_id,
            role,
            status,
        }
        .publish(&env);

        Ok(checkpoint_count)
    }

    pub fn get_summary(env: Env) -> BatchSummary {
        BatchSummary {
            batch_id: get_batch_id(&env),
            admin: get_admin(&env),
            producer: get_producer(&env),
            status: get_status(&env),
            current_role: get_current_role(&env),
            total_checkpoints: env
                .storage()
                .instance()
                .get(&DataKey::CheckpointCount)
                .unwrap_or(0u32),
        }
    }

    pub fn get_history(env: Env) -> Result<Vec<Checkpoint>, ContractError> {
        let count = get_checkpoint_count(&env)?;
        let mut history = Vec::new(&env);

        for index in 0..count {
            let checkpoint = env
                .storage()
                .persistent()
                .get(&DataKey::Checkpoint(index))
                .ok_or(ContractError::InvalidCheckpointCount)?;
            history.push_back(checkpoint);
        }

        Ok(history)
    }

    pub fn close_batch(env: Env, final_status: BatchStatus) -> Result<(), ContractError> {
        require_admin(&env);
        env.storage().instance().set(&DataKey::Status, &final_status);
        extend_instance_ttl(&env);

        BatchClosedEvent {
            batch_id: get_batch_id(&env),
            status: final_status,
        }
        .publish(&env);

        Ok(())
    }
}

fn require_admin(env: &Env) {
    let admin = get_admin(env);
    admin.require_auth();
}

fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

fn get_producer(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Producer).unwrap()
}

fn get_batch_id(env: &Env) -> String {
    env.storage().instance().get(&DataKey::BatchId).unwrap()
}

fn get_status(env: &Env) -> BatchStatus {
    env.storage().instance().get(&DataKey::Status).unwrap()
}

fn get_current_role(env: &Env) -> Role {
    env.storage().instance().get(&DataKey::CurrentRole).unwrap()
}

fn get_checkpoint_count(env: &Env) -> Result<u32, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::CheckpointCount)
        .ok_or(ContractError::InvalidCheckpointCount)
}

fn is_valid_transition(current_role: &Role, next_role: &Role) -> bool {
    matches!(
        (current_role, next_role),
        (Role::Producer, Role::Transporter)
            | (Role::Transporter, Role::Inspector)
            | (Role::Inspector, Role::Distributor)
    )
}

fn parse_role(env: &Env, role: &String) -> Result<Role, ContractError> {
    if role == &String::from_str(env, "producer") {
        Ok(Role::Producer)
    } else if role == &String::from_str(env, "transporter") {
        Ok(Role::Transporter)
    } else if role == &String::from_str(env, "inspector") {
        Ok(Role::Inspector)
    } else if role == &String::from_str(env, "distributor") {
        Ok(Role::Distributor)
    } else {
        Err(ContractError::InvalidRoleTransition)
    }
}

fn parse_status(env: &Env, status: &String) -> Result<BatchStatus, ContractError> {
    if status == &String::from_str(env, "harvested") {
        Ok(BatchStatus::Harvested)
    } else if status == &String::from_str(env, "in_transit") {
        Ok(BatchStatus::InTransit)
    } else if status == &String::from_str(env, "inspected") {
        Ok(BatchStatus::Inspected)
    } else if status == &String::from_str(env, "delivered") {
        Ok(BatchStatus::Delivered)
    } else if status == &String::from_str(env, "closed") {
        Ok(BatchStatus::Closed)
    } else {
        Err(ContractError::InvalidRoleTransition)
    }
}

fn extend_ttl(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(key, 100, 518400);
}

fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(100, 518400);
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn bytes(env: &Env, seed: u8) -> BytesN<32> {
        BytesN::from_array(env, &[seed; 32])
    }

    #[test]
    fn creates_batch_and_allows_valid_sequence() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let producer = Address::generate(&env);
        let transporter = Address::generate(&env);
        let inspector = Address::generate(&env);
        let distributor = Address::generate(&env);

        let contract_id = env.register(
            BatchContract,
            (
                admin.clone(),
                String::from_str(&env, "batch-001"),
                producer,
                bytes(&env, 1),
                1u64,
                bytes(&env, 2),
                String::from_str(&env, "db://initial"),
                bytes(&env, 3),
            ),
        );
        let client = BatchContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        assert_eq!(client.get_summary().total_checkpoints, 1);

        let index = client
            .add_checkpoint(
                &transporter,
                &String::from_str(&env, "transporter"),
                &bytes(&env, 4),
                &2u64,
                &bytes(&env, 5),
                &String::from_str(&env, "in_transit"),
                &String::from_str(&env, "db://transport"),
                &bytes(&env, 6),
            );
        assert_eq!(index, 1);

        client
            .add_checkpoint(
                &inspector,
                &String::from_str(&env, "inspector"),
                &bytes(&env, 7),
                &3u64,
                &bytes(&env, 8),
                &String::from_str(&env, "inspected"),
                &String::from_str(&env, "db://inspect"),
                &bytes(&env, 9),
            );

        client
            .add_checkpoint(
                &distributor,
                &String::from_str(&env, "distributor"),
                &bytes(&env, 10),
                &4u64,
                &bytes(&env, 11),
                &String::from_str(&env, "delivered"),
                &String::from_str(&env, "db://deliver"),
                &bytes(&env, 12),
            );

        let history = client.get_history();
        assert_eq!(history.len(), 4);
    }

    #[test]
    fn rejects_invalid_transition() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let producer = Address::generate(&env);
        let inspector = Address::generate(&env);

        let contract_id = env.register(
            BatchContract,
            (
                admin,
                String::from_str(&env, "batch-002"),
                producer,
                bytes(&env, 1),
                1u64,
                bytes(&env, 2),
                String::from_str(&env, "db://initial"),
                bytes(&env, 3),
            ),
        );
        let client = BatchContractClient::new(&env, &contract_id);

        env.mock_all_auths();

        let result = client.try_add_checkpoint(
            &inspector,
            &String::from_str(&env, "inspector"),
            &bytes(&env, 4),
            &2u64,
            &bytes(&env, 5),
            &String::from_str(&env, "inspected"),
            &String::from_str(&env, "db://inspect"),
            &bytes(&env, 6),
        );

        assert_eq!(result, Err(Ok(ContractError::InvalidRoleTransition)));
    }

    #[test]
    fn closes_batch() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let producer = Address::generate(&env);

        let contract_id = env.register(
            BatchContract,
            (
                admin,
                String::from_str(&env, "batch-003"),
                producer,
                bytes(&env, 1),
                1u64,
                bytes(&env, 2),
                String::from_str(&env, "db://initial"),
                bytes(&env, 3),
            ),
        );
        let client = BatchContractClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.close_batch(&BatchStatus::Closed);
        assert_eq!(client.get_summary().status, BatchStatus::Closed);
    }
}
