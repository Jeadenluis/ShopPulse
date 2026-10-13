-- ShopPulse database schema. Run once (MySQL Workbench, or: mysql -u root -p < database/setup.sql)
CREATE DATABASE IF NOT EXISTS shoppulse_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shoppulse_crm;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  woo_id BIGINT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  city VARCHAR(80) NULL,
  status ENUM('active','inactive','lead') NOT NULL DEFAULT 'active',
  source ENUM('demo','woocommerce','manual') NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_name (last_name, first_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  woo_id BIGINT NULL UNIQUE,
  order_number VARCHAR(30) NOT NULL,
  customer_id INT NOT NULL,
  order_date DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status ENUM('paid','pending','failed','refunded') NOT NULL DEFAULT 'pending',
  fulfillment_status ENUM('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  items TEXT NULL,
  notes VARCHAR(255) NULL,
  source ENUM('demo','woocommerce','manual') NOT NULL DEFAULT 'manual',
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_date (order_date),
  INDEX idx_orders_fulfillment (fulfillment_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS followups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  rule_type VARCHAR(30) NOT NULL,
  message TEXT NULL,
  status ENUM('drafted','completed') NOT NULL DEFAULT 'drafted',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_followups_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_followup (customer_id, rule_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sync_state (
  id TINYINT PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  message VARCHAR(255) NULL,
  last_attempt_at DATETIME NULL,
  last_success_at DATETIME NULL,
  customers_synced INT NOT NULL DEFAULT 0,
  orders_synced INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT IGNORE INTO sync_state (id, status, message) VALUES (1, 'never', 'No synchronization has run yet');
