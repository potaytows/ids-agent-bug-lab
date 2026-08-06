USE faultymart;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  color VARCHAR(30) NOT NULL,
  icon VARCHAR(16) NOT NULL,
  stock INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX products_category_idx (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_id VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('Processing', 'Cancelled') NOT NULL DEFAULT 'Processing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX orders_created_at_idx (created_at),
  INDEX orders_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  CONSTRAINT order_items_order_fk
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_fk
    FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX order_items_order_idx (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO products (id, name, category, price, color, icon, stock)
VALUES
  (1, 'Orbit Desk Lamp', 'Home', 12.00, 'mustard', '◒', 6),
  (2, 'Pocket Field Notes', 'Stationery', 9.50, 'teal', '▤', 12),
  (3, 'Cloud Nine Mug', 'Kitchen', 22.00, 'coral', '◡', 4),
  (4, 'Tiny Task Timer', 'Office', 105.00, 'ink', '◴', 2),
  (5, 'Loop Cable Kit', 'Tech', 18.25, 'blue', '⌁', 8),
  (6, 'Sunday Tote', 'Lifestyle', 34.00, 'peach', '∩', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  price = VALUES(price),
  color = VALUES(color),
  icon = VALUES(icon),
  stock = VALUES(stock);

CREATE USER IF NOT EXISTS 'ids_reader'@'%'
  IDENTIFIED WITH mysql_native_password BY 'ids_reader_local_only';
GRANT SELECT ON faultymart.* TO 'ids_reader'@'%';
FLUSH PRIVILEGES;
