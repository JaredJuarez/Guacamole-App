CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(128) NULL,
  contact_email VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'producer', 'transporter', 'inspector', 'distributor') NOT NULL,
  wallet_public_key VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  public_key VARCHAR(80) NOT NULL,
  custody_mode ENUM('custodial', 'external') NOT NULL DEFAULT 'external',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL UNIQUE,
  contract_id VARCHAR(80) NULL,
  producer_id BIGINT NOT NULL,
  status ENUM('harvested', 'in_transit', 'inspected', 'delivered', 'closed') NOT NULL,
  current_role ENUM('producer', 'transporter', 'inspector', 'distributor') NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  variety VARCHAR(255) NULL,
  weight_kg DECIMAL(12, 3) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_batches_producer FOREIGN KEY (producer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS batch_checkpoints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  role ENUM('producer', 'transporter', 'inspector', 'distributor') NOT NULL,
  status ENUM('harvested', 'in_transit', 'inspected', 'delivered', 'closed') NOT NULL,
  location_hash CHAR(64) NOT NULL,
  photo_hash CHAR(64) NOT NULL,
  tx_hash CHAR(64) NULL,
  db_ref VARCHAR(255) NOT NULL,
  checkpoint_order INT NOT NULL,
  timestamp_onchain DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkpoints_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_checkpoints_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT NOT NULL,
  checkpoint_id BIGINT NULL,
  storage_url TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_media_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES batch_checkpoints(id)
);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT NOT NULL,
  checkpoint_id BIGINT NULL,
  contract_id VARCHAR(80) NULL,
  operation ENUM('create_batch', 'add_checkpoint', 'close_batch') NOT NULL,
  tx_hash CHAR(64) NOT NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL,
  payload_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_transactions_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES batch_checkpoints(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT NULL,
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  details_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

