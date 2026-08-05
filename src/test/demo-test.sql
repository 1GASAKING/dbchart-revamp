-- ============================================================
-- DBChat Demo SQL File
-- A comprehensive test SQL file for validating SQL tool functionality
-- Contains DDL, DML, DQL, joins, aggregations, CTEs, and more
-- ============================================================

-- ============================================================
-- SECTION 1: Database & Schema Setup (DDL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS dbchat_demo;
USE dbchat_demo;

-- Drop existing tables for clean slate
DROP TABLE IF EXISTS order_details;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS employees;

-- Create Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- Create Customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    registration_date DATE DEFAULT (CURRENT_DATE),
    is_active BOOLEAN DEFAULT TRUE,
    credit_limit DECIMAL(12, 2) DEFAULT 5000.00
);

-- Create Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    cost_price DECIMAL(10, 2),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    is_discontinued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create Employees table
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),
    manager_id INT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(12, 2),
    commission_rate DECIMAL(4, 2) DEFAULT 0,
    email VARCHAR(255) UNIQUE,
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

-- Create Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    employee_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_date DATE,
    shipped_date DATE NULL,
    status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_country VARCHAR(100),
    payment_method VARCHAR(50),
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Create Order Details table
CREATE TABLE order_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(4, 2) DEFAULT 0,
    line_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount)) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_country ON customers(country);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_employee ON orders(employee_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order ON order_details(order_id);
CREATE INDEX idx_order_details_product ON order_details(product_id);

-- ============================================================
-- SECTION 2: Sample Data Insertion (DML)
-- ============================================================

-- Insert categories
INSERT INTO categories (name, description, parent_category_id) VALUES
('Electronics', 'Electronic devices and accessories', NULL),
('Computers', 'Desktop and laptop computers', 1),
('Smartphones', 'Mobile phones and accessories', 1),
('Audio', 'Headphones, speakers, and audio equipment', 1),
('Clothing', 'Apparel and fashion items', NULL),
('Men''s Clothing', 'Clothing for men', 5),
('Women''s Clothing', 'Clothing for women', 5),
('Books', 'Printed and digital books', NULL),
('Home & Garden', 'Home improvement and garden supplies', NULL),
('Sports', 'Sports equipment and gear', NULL);

-- Insert customers
INSERT INTO customers (first_name, last_name, email, phone, city, state, country, registration_date, is_active, credit_limit) VALUES
('John', 'Smith', 'john.smith@email.com', '555-0101', 'New York', 'NY', 'USA', '2023-01-15', TRUE, 10000.00),
('Jane', 'Doe', 'jane.doe@email.com', '555-0102', 'Los Angeles', 'CA', 'USA', '2023-02-20', TRUE, 7500.00),
('Bob', 'Johnson', 'bob.johnson@email.com', '555-0103', 'Chicago', 'IL', 'USA', '2023-03-10', TRUE, 5000.00),
('Alice', 'Williams', 'alice.williams@email.com', '555-0104', 'Houston', 'TX', 'USA', '2023-04-05', FALSE, 3000.00),
('Charlie', 'Brown', 'charlie.brown@email.com', '555-0105', 'Phoenix', 'AZ', 'USA', '2023-05-12', TRUE, 8500.00),
('Diana', 'Miller', 'diana.miller@email.com', '555-0106', 'Philadelphia', 'PA', 'USA', '2023-06-18', TRUE, 6000.00),
('Edward', 'Davis', 'edward.davis@email.com', '555-0107', 'San Antonio', 'TX', 'USA', '2023-07-22', TRUE, 12000.00),
('Fiona', 'Garcia', 'fiona.garcia@email.com', '555-0108', 'San Diego', 'CA', 'USA', '2023-08-30', FALSE, 4000.00),
('George', 'Martinez', 'george.martinez@email.com', '555-0109', 'Dallas', 'TX', 'USA', '2023-09-14', TRUE, 9500.00),
('Hannah', 'Anderson', 'hannah.anderson@email.com', '555-0110', 'San Jose', 'CA', 'USA', '2023-10-01', TRUE, 7000.00);

-- Insert employees
INSERT INTO employees (employee_code, first_name, last_name, job_title, department, manager_id, hire_date, salary, commission_rate, email) VALUES
('EMP001', 'Sarah', 'Johnson', 'CEO', 'Executive', NULL, '2020-01-01', 250000.00, 0, 'sarah.johnson@company.com'),
('EMP002', 'Michael', 'Brown', 'VP Sales', 'Sales', 1, '2020-02-15', 180000.00, 0.05, 'michael.brown@company.com'),
('EMP003', 'Emily', 'Wilson', 'VP Engineering', 'Engineering', 1, '2020-03-01', 190000.00, 0, 'emily.wilson@company.com'),
('EMP004', 'James', 'Taylor', 'Sales Manager', 'Sales', 2, '2020-04-10', 120000.00, 0.03, 'james.taylor@company.com'),
('EMP005', 'Jessica', 'Thomas', 'Sales Rep', 'Sales', 4, '2021-01-15', 75000.00, 0.02, 'jessica.thomas@company.com'),
('EMP006', 'Daniel', 'Jackson', 'Sales Rep', 'Sales', 4, '2021-02-20', 72000.00, 0.02, 'daniel.jackson@company.com'),
('EMP007', 'Laura', 'White', 'Senior Developer', 'Engineering', 3, '2021-03-10', 130000.00, 0, 'laura.white@company.com'),
('EMP008', 'David', 'Harris', 'Developer', 'Engineering', 7, '2022-01-05', 95000.00, 0, 'david.harris@company.com'),
('EMP009', 'Amanda', 'Martin', 'HR Manager', 'HR', 1, '2020-06-01', 110000.00, 0, 'amanda.martin@company.com'),
('EMP010', 'Kevin', 'Lee', 'Junior Developer', 'Engineering', 7, '2023-01-10', 65000.00, 0, 'kevin.lee@company.com');

-- Insert products
INSERT INTO products (sku, name, description, category_id, unit_price, cost_price, stock_quantity, reorder_level) VALUES
('ELEC-LAP-001', 'ProBook X1 Laptop', 'High-performance laptop with 16GB RAM, 512GB SSD', 2, 1299.99, 950.00, 50, 10),
('ELEC-LAP-002', 'UltraBook Air', 'Lightweight laptop with 13" display, 8GB RAM', 2, 999.99, 700.00, 35, 10),
('ELEC-PHN-001', 'SmartPhone Pro Max', '6.7" OLED display, 256GB storage', 3, 1099.99, 800.00, 100, 20),
('ELEC-PHN-002', 'SmartPhone Lite', '5.8" display, 128GB storage, budget-friendly', 3, 499.99, 350.00, 150, 30),
('ELEC-AUD-001', 'Noise-Cancelling Headphones', 'Wireless over-ear headphones with ANC', 4, 349.99, 200.00, 75, 15),
('ELEC-AUD-002', 'Portable Bluetooth Speaker', 'Waterproof speaker with 20hr battery', 4, 79.99, 45.00, 200, 40),
('CLOTH-MEN-001', 'Classic Fit Suit', 'Navy blue two-piece suit, 100% wool', 6, 599.99, 350.00, 25, 5),
('CLOTH-MEN-002', 'Casual Button-Down Shirt', 'Cotton shirt, available in 5 colors', 6, 49.99, 25.00, 300, 50),
('CLOTH-WMN-001', 'Elegant Evening Gown', 'Silk evening gown, floor-length', 7, 299.99, 150.00, 20, 5),
('CLOTH-WMN-002', 'Summer Dress', 'Floral print summer dress', 7, 89.99, 45.00, 100, 20),
('BOOK-001', 'SQL Mastery Guide', 'Comprehensive guide to SQL programming', 8, 49.99, 25.00, 500, 100),
('BOOK-002', 'Data Science for Beginners', 'Introduction to data science concepts', 8, 39.99, 20.00, 400, 80),
('HOME-001', 'Smart Thermostat', 'WiFi-enabled thermostat with AI learning', 9, 199.99, 120.00, 60, 15),
('HOME-002', 'Robot Vacuum Cleaner', 'Self-charging robot vacuum with mapping', 9, 399.99, 250.00, 40, 10),
('SPORT-001', 'Pro Running Shoes', 'Lightweight running shoes with carbon plate', 10, 249.99, 140.00, 80, 15),
('SPORT-002', 'Yoga Mat Premium', 'Non-slip yoga mat, 6mm thickness', 10, 39.99, 18.00, 200, 40);

-- Insert orders
INSERT INTO orders (order_number, customer_id, employee_id, order_date, required_date, shipped_date, status, shipping_city, shipping_country, payment_method, total_amount, notes) VALUES
('ORD-2024-0001', 1, 5, '2024-01-05 10:30:00', '2024-01-12', '2024-01-10', 'DELIVERED', 'New York', 'USA', 'CREDIT_CARD', 2349.98, 'Express shipping requested'),
('ORD-2024-0002', 2, 6, '2024-01-08 14:15:00', '2024-01-15', '2024-01-12', 'DELIVERED', 'Los Angeles', 'USA', 'PAYPAL', 799.98, NULL),
('ORD-2024-0003', 3, 5, '2024-01-12 09:00:00', '2024-01-19', '2024-01-18', 'DELIVERED', 'Chicago', 'USA', 'DEBIT_CARD', 349.99, 'Gift wrapping included'),
('ORD-2024-0004', 1, NULL, '2024-01-15 11:45:00', '2024-01-22', NULL, 'PENDING', 'New York', 'USA', 'CREDIT_CARD', 599.99, 'Awaiting payment confirmation'),
('ORD-2024-0005', 4, 6, '2024-02-01 08:30:00', '2024-02-08', '2024-02-05', 'SHIPPED', 'Houston', 'USA', 'PAYPAL', 1299.99, NULL),
('ORD-2024-0006', 5, 5, '2024-02-05 16:20:00', '2024-02-12', NULL, 'PROCESSING', 'Phoenix', 'USA', 'CREDIT_CARD', 1849.97, 'Call before delivery'),
('ORD-2024-0007', 6, 6, '2024-02-10 13:00:00', '2024-02-17', '2024-02-15', 'DELIVERED', 'Philadelphia', 'USA', 'DEBIT_CARD', 89.99, NULL),
('ORD-2024-0008', 7, NULL, '2024-02-15 10:00:00', '2024-02-22', NULL, 'PENDING', 'San Antonio', 'USA', 'BANK_TRANSFER', 499.99, 'International shipping'),
('ORD-2024-0009', 8, 5, '2024-02-20 15:30:00', '2024-02-27', '2024-02-25', 'DELIVERED', 'San Diego', 'USA', 'CREDIT_CARD', 1599.98, NULL),
('ORD-2024-0010', 9, 6, '2024-03-01 09:15:00', '2024-03-08', NULL, 'CANCELLED', 'Dallas', 'USA', 'PAYPAL', 2499.99, 'Customer cancelled due to delay'),
('ORD-2024-0011', 10, NULL, '2024-03-05 11:00:00', '2024-03-12', '2024-03-10', 'DELIVERED', 'San Jose', 'USA', 'CREDIT_CARD', 1199.97, NULL),
('ORD-2024-0012', 2, 5, '2024-03-10 14:45:00', '2024-03-17', NULL, 'PROCESSING', 'Los Angeles', 'USA', 'PAYPAL', 449.98, 'Split shipment requested'),
('ORD-2024-0013', 1, 6, '2024-03-15 08:00:00', '2024-03-22', '2024-03-20', 'SHIPPED', 'New York', 'USA', 'CREDIT_CARD', 799.99, NULL),
('ORD-2024-0014', 3, NULL, '2024-03-20 17:30:00', '2024-03-27', NULL, 'PENDING', 'Chicago', 'USA', 'DEBIT_CARD', 39.99, 'Pick up in store'),
('ORD-2024-0015', 6, 5, '2024-03-25 12:00:00', '2024-04-01', '2024-03-30', 'DELIVERED', 'Philadelphia', 'USA', 'BANK_TRANSFER', 1349.98, NULL);

-- Insert order details
INSERT INTO order_details (order_id, product_id, quantity, unit_price, discount) VALUES
-- Order 1: ProBook Laptop + Headphones
(1, 1, 1, 1299.99, 0),
(1, 5, 3, 349.99, 0),

-- Order 2: SmartPhone Lite + Bluetooth Speaker
(2, 4, 1, 499.99, 0),
(2, 6, 2, 79.99, 0.10),
(2, 12, 1, 39.99, 0),

-- Order 3: Headphones (discounted)
(3, 5, 1, 349.99, 0),

-- Order 4: Classic Fit Suit
(4, 7, 1, 599.99, 0),

-- Order 5: ProBook Laptop
(5, 1, 1, 1299.99, 0),

-- Order 6: Various items
(6, 3, 1, 1099.99, 0),
(6, 6, 2, 79.99, 0),
(6, 12, 1, 39.99, 0),

-- Order 7: Summer Dress
(7, 10, 1, 89.99, 0),

-- Order 8: SmartPhone Lite
(8, 4, 1, 499.99, 0),

-- Order 9: ProBook + SQL Book
(9, 1, 1, 1299.99, 0),
(9, 11, 1, 49.99, 0),

-- Order 10: SmartPhone Pro Max + Running Shoes (cancelled)
(10, 3, 1, 1099.99, 0),
(10, 15, 1, 249.99, 0),
(10, 13, 1, 199.99, 0),

-- Order 11: Headphones + Smart Thermostat + Yoga Mat
(11, 5, 1, 349.99, 0),
(11, 13, 1, 199.99, 0),
(11, 16, 2, 39.99, 0),

-- Order 12: Shirt + Summer Dress
(12, 8, 3, 49.99, 0),
(12, 10, 2, 89.99, 0),

-- Order 13: UltraBook Air
(13, 2, 1, 999.99, 0.20),

-- Order 14: Yoga Mat
(14, 16, 1, 39.99, 0),

-- Order 15: Running Shoes + Bluetooth Speaker + SQL Book
(15, 15, 1, 249.99, 0),
(15, 6, 2, 79.99, 0),
(15, 12, 1, 39.99, 0);

-- ============================================================
-- SECTION 3: Sample Queries (DQL) for Testing
-- ============================================================

-- 3.1 Simple SELECT queries
-- All active customers
SELECT * FROM customers WHERE is_active = TRUE;

-- Products with low stock
SELECT name, sku, stock_quantity 
FROM products 
WHERE stock_quantity <= reorder_level 
ORDER BY stock_quantity ASC;

-- 3.2 JOIN queries
-- Orders with customer names
SELECT o.order_number, c.first_name, c.last_name, o.total_amount, o.status
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.order_date DESC;

-- Order details with product info
SELECT 
    o.order_number,
    p.name AS product_name,
    od.quantity,
    od.unit_price,
    od.discount,
    od.line_total
FROM order_details od
JOIN orders o ON od.order_id = o.id
JOIN products p ON od.product_id = p.id;

-- 3.3 Aggregate queries
-- Total sales by category
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT o.id) AS order_count,
    SUM(od.line_total) AS total_sales
FROM categories c
JOIN products p ON c.id = p.category_id
JOIN order_details od ON p.id = od.product_id
JOIN orders o ON od.order_id = o.id
WHERE o.status IN ('DELIVERED', 'SHIPPED')
GROUP BY c.name
ORDER BY total_sales DESC;

-- Monthly sales trend
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(*) AS order_count,
    SUM(total_amount) AS revenue
FROM orders
WHERE status NOT IN ('CANCELLED')
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;

-- 3.4 Subqueries
-- Customers who spent more than average
SELECT c.first_name, c.last_name, 
    (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id) AS total_spent
FROM customers c
WHERE (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.id) > 
      (SELECT AVG(customer_total) FROM (
          SELECT SUM(total_amount) AS customer_total 
          FROM orders 
          WHERE status NOT IN ('CANCELLED')
          GROUP BY customer_id
      ) AS avg_table)
ORDER BY total_spent DESC;

-- 3.5 CTE (Common Table Expression) queries
WITH sales_by_employee AS (
    SELECT 
        e.id AS employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        COUNT(o.id) AS orders_handled,
        SUM(o.total_amount) AS total_sales
    FROM employees e
    JOIN orders o ON e.id = o.employee_id
    WHERE o.status NOT IN ('CANCELLED')
    GROUP BY e.id, e.first_name, e.last_name
)
SELECT 
    employee_name,
    orders_handled,
    total_sales,
    RANK() OVER (ORDER BY total_sales DESC) AS sales_rank
FROM sales_by_employee
ORDER BY sales_rank;

-- Product performance with CTE
WITH product_sales AS (
    SELECT 
        p.id,
        p.name,
        SUM(od.quantity) AS total_units_sold,
        SUM(od.line_total) AS total_revenue,
        AVG(od.discount) AS avg_discount
    FROM products p
    JOIN order_details od ON p.id = od.product_id
    JOIN orders o ON od.order_id = o.id
    WHERE o.status IN ('DELIVERED', 'SHIPPED')
    GROUP BY p.id, p.name
)
SELECT 
    name,
    total_units_sold,
    total_revenue,
    avg_discount,
    CASE 
        WHEN total_revenue > 1000 THEN 'High Performer'
        WHEN total_revenue > 500 THEN 'Mid Performer'
        ELSE 'Low Performer'
    END AS performance_tier
FROM product_sales
ORDER BY total_revenue DESC;

-- 3.6 Window function queries
-- Running total of sales by month
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    total_amount,
    SUM(total_amount) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')) AS running_total,
    AVG(total_amount) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')) AS moving_avg
FROM orders
WHERE status = 'DELIVERED';

-- 3.7 Complex multi-table query
SELECT 
    c.country,
    c.state,
    COUNT(DISTINCT c.id) AS customer_count,
    COUNT(DISTINCT o.id) AS order_count,
    COALESCE(SUM(od.line_total), 0) AS total_revenue,
    COALESCE(SUM(od.line_total) / NULLIF(COUNT(DISTINCT o.id), 0), 0) AS avg_order_value
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('DELIVERED', 'SHIPPED')
LEFT JOIN order_details od ON o.id = od.order_id
WHERE c.is_active = TRUE
GROUP BY c.country, c.state
HAVING customer_count > 0
ORDER BY total_revenue DESC;

-- ============================================================
-- SECTION 4: Views and Stored Procedures
-- ============================================================

-- Create a view for top products
CREATE OR REPLACE VIEW v_top_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    c.name AS category,
    SUM(od.quantity) AS total_sold,
    SUM(od.line_total) AS revenue
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN order_details od ON p.id = od.product_id
JOIN orders o ON od.order_id = o.id
WHERE o.status IN ('DELIVERED', 'SHIPPED')
GROUP BY p.id, p.name, p.sku, c.name
ORDER BY revenue DESC
LIMIT 10;

-- Query the view
SELECT * FROM v_top_products;

-- Drop procedure if exists
DROP PROCEDURE IF EXISTS sp_get_customer_orders;

-- Stored procedure to get customer order summary
DELIMITER //
CREATE PROCEDURE sp_get_customer_orders(IN p_customer_id INT)
BEGIN
    SELECT 
        c.first_name,
        c.last_name,
        c.email,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.order_date) AS last_order_date,
        MIN(o.order_date) AS first_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.status NOT IN ('CANCELLED')
    WHERE c.id = p_customer_id
    GROUP BY c.id, c.first_name, c.last_name, c.email;
    
    -- Also return order details
    SELECT 
        o.order_number,
        o.order_date,
        o.status,
        o.total_amount,
        COUNT(od.id) AS line_items
    FROM orders o
    LEFT JOIN order_details od ON o.id = od.order_id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.id, o.order_number, o.order_date, o.status, o.total_amount
    ORDER BY o.order_date DESC;
END //
DELIMITER ;

-- Call the stored procedure
CALL sp_get_customer_orders(1);

-- ============================================================
-- SECTION 5: Data Modification Queries (DML)
-- ============================================================

-- Update product prices
UPDATE products 
SET unit_price = unit_price * 1.05 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Electronics');

-- Update order status for delayed orders
UPDATE orders 
SET status = 'PROCESSING', notes = CONCAT(IFNULL(notes, ''), ' | Overdue - escalated')
WHERE required_date < CURRENT_DATE AND status = 'PENDING';

-- Update stock after shipment (for order 1)
UPDATE products p
JOIN order_details od ON p.id = od.product_id
SET p.stock_quantity = p.stock_quantity - od.quantity
WHERE od.order_id = 1;

-- ============================================================
-- SECTION 6: Test Queries with Errors (for error handling testing)
-- ============================================================

-- This query intentionally has an error: misspelled table name (customers -> customer)
-- SELECT * FROM customer WHERE id = 1;

-- This query has a syntax error: missing FROM clause
-- SELECT GETDATE();

-- ============================================================
-- SECTION 7: Complex Analytical Query
-- ============================================================

-- Customer lifetime value segmentation
WITH customer_metrics AS (
    SELECT 
        c.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.city,
        c.state,
        c.registration_date,
        DATEDIFF(CURRENT_DATE, c.registration_date) AS days_as_customer,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
        MAX(o.order_date) AS last_order_date,
        DATEDIFF(CURRENT_DATE, MAX(o.order_date)) AS days_since_last_order
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.status NOT IN ('CANCELLED')
    GROUP BY c.id, c.first_name, c.last_name, c.city, c.state, c.registration_date
)
SELECT 
    *,
    CASE 
        WHEN lifetime_value > 2000 AND days_since_last_order < 60 THEN 'VIP Active'
        WHEN lifetime_value > 1000 AND days_since_last_order < 90 THEN 'Loyal Active'
        WHEN lifetime_value > 500 AND days_since_last_order < 180 THEN 'Standard Active'
        WHEN days_since_last_order > 180 AND lifetime_value > 0 THEN 'At Risk'
        WHEN order_count = 0 AND days_as_customer > 90 THEN 'Never Converted'
        ELSE 'New / Low Value'
    END AS customer_segment,
    RANK() OVER (ORDER BY lifetime_value DESC) AS value_rank
FROM customer_metrics
ORDER BY lifetime_value DESC;

-- ============================================================
-- End of Demo SQL File
-- ============================================================