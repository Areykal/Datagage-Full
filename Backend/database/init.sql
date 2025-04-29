-- Drop the table if it exists
DROP TABLE IF EXISTS sales;

-- Create sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    product VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP NOT NULL
);

-- Insert sample data
INSERT INTO sales (id, customer_name, product, quantity, unit_price, total_amount, sale_date) VALUES
(1, 'Lauren Smith', 'Mouse', 3, 30.00, 90.00, '2025-01-28 13:50:17'),
(2, 'John Mason', 'Headphones', 2, 100.00, 200.00, '2025-02-10 16:28:19'),
(3, 'Thomas Melton', 'Headphones', 5, 100.00, 500.00, '2025-02-14 04:15:03'),
(4, 'Jamie Anderson', 'Headphones', 4, 100.00, 400.00, '2025-01-30 17:29:33'),
(5, 'Kenneth Baker', 'Laptop', 3, 800.00, 2400.00, '2025-01-22 13:32:57'),
(6, 'Matthew Foster', 'Mouse', 5, 30.00, 150.00, '2025-02-06 23:11:00'),
(7, 'Peter Trevino', 'Laptop', 5, 800.00, 4000.00, '2025-01-26 22:34:20'),
(8, 'Alyssa Cobb', 'Headphones', 5, 100.00, 500.00, '2025-01-24 07:25:20'),
(9, 'Lisa Collier', 'Laptop', 5, 800.00, 4000.00, '2025-01-28 04:40:01'),
(10, 'Frank Juarez', 'Headphones', 4, 100.00, 400.00, '2025-01-24 07:58:00'),
(11, 'Sarah Duncan', 'Mouse', 4, 30.00, 120.00, '2025-02-04 21:48:26'),
(12, 'Michael Wood', 'Smartphone', 5, 500.00, 2500.00, '2025-02-02 08:21:17'),
(13, 'James Richardson', 'Keyboard', 5, 50.00, 250.00, '2025-01-27 20:06:18'),
(14, 'Leah Owens', 'Monitor', 3, 300.00, 900.00, '2025-02-03 19:07:02'),
(15, 'Rachel Espinoza', 'Monitor', 4, 300.00, 1200.00, '2025-02-10 22:15:43'),
(16, 'Keith Lewis', 'Monitor', 4, 300.00, 1200.00, '2025-01-25 02:28:23'),
(17, 'Carla Reed', 'Keyboard', 5, 50.00, 250.00, '2025-02-16 06:04:51'),
(18, 'Donna Wood', 'Headphones', 4, 100.00, 400.00, '2025-02-04 20:57:03'),
(19, 'Daniel Case', 'Headphones', 3, 100.00, 300.00, '2025-01-30 13:23:22'),
(20, 'Zachary Gonzalez', 'Keyboard', 4, 50.00, 200.00, '2025-02-16 20:13:21'),
(21, 'Albert Floyd', 'Mouse', 3, 30.00, 90.00, '2025-02-05 12:22:55'),
(22, 'Scott Dean', 'Keyboard', 5, 50.00, 250.00, '2025-02-07 16:39:18'),
(23, 'Krystal Lewis', 'Smartphone', 1, 500.00, 500.00, '2025-02-06 21:14:41'),
(24, 'Stephen Murphy', 'Monitor', 5, 300.00, 1500.00, '2025-02-03 05:25:58'),
(25, 'Barbara Anderson', 'Smartphone', 1, 500.00, 500.00, '2025-01-21 10:06:22'),
(26, 'Roger Anderson', 'Smartphone', 1, 500.00, 500.00, '2025-02-03 16:40:33'),
(27, 'Sharon Lane', 'Mouse', 5, 30.00, 150.00, '2025-01-29 04:57:49'),
(28, 'Thomas White', 'Mouse', 3, 30.00, 90.00, '2025-01-31 06:29:03'),
(29, 'Mr. Tony Miller DVM', 'Keyboard', 4, 50.00, 200.00, '2025-02-05 02:37:03'),
(30, 'Robin Khan', 'Monitor', 5, 300.00, 1500.00, '2025-01-23 21:01:10'),
(31, 'Matthew Schultz', 'Monitor', 3, 300.00, 900.00, '2025-02-12 06:04:35'),
(32, 'Angela Hansen', 'Laptop', 1, 800.00, 800.00, '2025-02-17 04:24:53'),
(33, 'James Roberts', 'Smartphone', 4, 500.00, 2000.00, '2025-02-11 00:22:49'),
(34, 'Daniel Young', 'Smartphone', 2, 500.00, 1000.00, '2025-02-16 11:40:03'),
(35, 'Matthew Velez', 'Headphones', 3, 100.00, 300.00, '2025-01-23 21:47:55'),
(36, 'Brandon Rogers', 'Laptop', 1, 800.00, 800.00, '2025-01-22 16:50:01'),
(37, 'Dustin Richards', 'Smartphone', 5, 500.00, 2500.00, '2025-01-25 16:14:42'),
(38, 'Michael Nunez', 'Monitor', 2, 300.00, 600.00, '2025-01-27 08:21:36'),
(39, 'Joan Ellis', 'Headphones', 1, 100.00, 100.00, '2025-02-08 11:35:01'),
(40, 'Johnathan Santana', 'Keyboard', 4, 50.00, 200.00, '2025-01-25 22:32:27'),
(41, 'Benjamin Barnett', 'Smartphone', 3, 500.00, 1500.00, '2025-02-04 03:58:47'),
(42, 'Christine Roach', 'Headphones', 4, 100.00, 400.00, '2025-02-01 08:34:36'),
(43, 'Jill Peterson', 'Headphones', 2, 100.00, 200.00, '2025-02-06 14:30:17'),
(44, 'Angelica Cruz', 'Smartphone', 1, 500.00, 500.00, '2025-01-24 00:13:51'),
(45, 'Vernon Anderson', 'Laptop', 5, 800.00, 4000.00, '2025-01-25 08:50:01'),
(46, 'John Drake', 'Monitor', 2, 300.00, 600.00, '2025-01-29 10:18:00'),
(47, 'Lisa Reyes', 'Keyboard', 4, 50.00, 200.00, '2025-01-22 03:15:51'),
(48, 'David Morse', 'Smartphone', 4, 500.00, 2000.00, '2025-02-09 03:12:50'),
(49, 'Scott Blackwell', 'Smartphone', 1, 500.00, 500.00, '2025-01-22 03:06:01'),
(50, 'Derek Mcgee MD', 'Smartphone', 3, 500.00, 1500.00, '2025-02-07 20:06:55');

-- Reset the sequence
SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE sales TO datagage_user;
GRANT USAGE, SELECT ON SEQUENCE sales_id_seq TO datagage_user;
