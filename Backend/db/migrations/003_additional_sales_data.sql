-- Add more sales data with customer segmentation and better trends
BEGIN;

-- First check if we have already run this migration
DO $$ 
BEGIN
  IF (SELECT COUNT(*) FROM sales) < 100 THEN  -- If we have fewer than 100 rows, add more data
    
    -- Add more enterprise customers
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      -- Enterprise customers with larger orders
      ('Acme Corporation', 'Enterprise Suite', 5, 999.99, 4999.95, '2025-01-15 09:25:00'),
      ('Acme Corporation', 'Premium Widget', 20, 149.99, 2999.80, '2025-01-18 14:30:00'),
      ('Tech Solutions Inc', 'Enterprise Suite', 3, 999.99, 2999.97, '2025-01-22 11:15:00'),
      ('Global Logistics', 'Premium Widget', 15, 149.99, 2249.85, '2025-01-25 16:45:00'),
      ('Smith Enterprises', 'Enterprise Suite', 4, 999.99, 3999.96, '2025-01-30 10:20:00'),
      
      ('Acme Corporation', 'Standard Package', 12, 89.99, 1079.88, '2025-02-05 13:10:00'),
      ('Tech Solutions Inc', 'Premium Widget', 8, 149.99, 1199.92, '2025-02-12 15:25:00'),
      ('Retail Partners', 'Budget Solution', 25, 49.99, 1249.75, '2025-02-18 09:40:00'),
      ('Smith Enterprises', 'Standard Package', 15, 89.99, 1349.85, '2025-02-23 14:05:00'),
      ('Global Logistics', 'Enterprise Suite', 2, 999.99, 1999.98, '2025-02-28 11:30:00'),
      
      ('Acme Corporation', 'Premium Widget', 18, 149.99, 2699.82, '2025-03-07 10:15:00'),
      ('Tech Solutions Inc', 'Standard Package', 20, 89.99, 1799.80, '2025-03-14 13:45:00'),
      ('Smith Enterprises', 'Enterprise Suite', 3, 999.99, 2999.97, '2025-03-21 09:30:00'),
      ('Global Logistics', 'Budget Solution', 30, 49.99, 1499.70, '2025-03-25 15:20:00'),
      ('Retail Partners', 'Premium Widget', 10, 149.99, 1499.90, '2025-03-29 11:05:00'),
      
      ('Acme Corporation', 'Enterprise Suite', 6, 999.99, 5999.94, '2025-04-04 14:25:00'),
      ('Smith Enterprises', 'Premium Widget', 25, 149.99, 3749.75, '2025-04-09 10:40:00'),
      ('Tech Solutions Inc', 'Enterprise Suite', 4, 999.99, 3999.96, '2025-04-15 13:15:00'),
      ('Global Logistics', 'Standard Package', 18, 89.99, 1619.82, '2025-04-19 16:30:00'),
      ('Retail Partners', 'Enterprise Suite', 2, 999.99, 1999.98, '2025-04-24 09:50:00');
    
    -- Add consistent smaller orders for regular customers
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      -- Regular customer 1: Sophie Johnson - likes Standard Package and Budget Solution
      ('Sophie Johnson', 'Standard Package', 2, 89.99, 179.98, '2025-01-08 10:30:00'),
      ('Sophie Johnson', 'Budget Solution', 3, 49.99, 149.97, '2025-01-23 15:45:00'),
      ('Sophie Johnson', 'Standard Package', 1, 89.99, 89.99, '2025-02-10 11:20:00'),
      ('Sophie Johnson', 'Budget Solution', 2, 49.99, 99.98, '2025-02-25 14:35:00'),
      ('Sophie Johnson', 'Standard Package', 2, 89.99, 179.98, '2025-03-12 09:15:00'),
      ('Sophie Johnson', 'Budget Solution', 4, 49.99, 199.96, '2025-03-27 16:50:00'),
      ('Sophie Johnson', 'Standard Package', 1, 89.99, 89.99, '2025-04-10 13:25:00'),
      ('Sophie Johnson', 'Budget Solution', 3, 49.99, 149.97, '2025-04-22 10:40:00'),

      -- Regular customer 2: William Taylor - prefers Premium Widget
      ('William Taylor', 'Premium Widget', 1, 149.99, 149.99, '2025-01-05 14:20:00'),
      ('William Taylor', 'Starter Kit', 2, 29.99, 59.98, '2025-01-27 09:35:00'),
      ('William Taylor', 'Premium Widget', 1, 149.99, 149.99, '2025-02-08 15:10:00'),
      ('William Taylor', 'Budget Solution', 2, 49.99, 99.98, '2025-02-20 11:45:00'),
      ('William Taylor', 'Premium Widget', 2, 149.99, 299.98, '2025-03-10 13:30:00'),
      ('William Taylor', 'Starter Kit', 3, 29.99, 89.97, '2025-03-23 16:15:00'),
      ('William Taylor', 'Premium Widget', 1, 149.99, 149.99, '2025-04-07 10:50:00'),
      ('William Taylor', 'Premium Widget', 2, 149.99, 299.98, '2025-04-21 14:05:00'),

      -- Regular customer 3: Ethan Thompson - mixed preferences
      ('Ethan Thompson', 'Budget Solution', 3, 49.99, 149.97, '2025-01-12 11:55:00'),
      ('Ethan Thompson', 'Standard Package', 1, 89.99, 89.99, '2025-01-29 16:40:00'),
      ('Ethan Thompson', 'Premium Widget', 1, 149.99, 149.99, '2025-02-14 13:05:00'),
      ('Ethan Thompson', 'Budget Solution', 2, 49.99, 99.98, '2025-02-27 09:50:00'),
      ('Ethan Thompson', 'Standard Package', 2, 89.99, 179.98, '2025-03-15 15:35:00'),
      ('Ethan Thompson', 'Premium Widget', 1, 149.99, 149.99, '2025-03-30 11:20:00'),
      ('Ethan Thompson', 'Budget Solution', 3, 49.99, 149.97, '2025-04-16 14:45:00'),
      ('Ethan Thompson', 'Standard Package', 1, 89.99, 89.99, '2025-04-26 10:10:00');
    
    -- Add some seasonal variation for product popularity
    -- January: Higher Budget Solution sales (New Year resolutions)
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      ('Jennifer Lopez', 'Budget Solution', 2, 49.99, 99.98, '2025-01-03 09:15:00'),
      ('Michael Brown', 'Budget Solution', 3, 49.99, 149.97, '2025-01-07 14:30:00'),
      ('Ashley Wilson', 'Budget Solution', 4, 49.99, 199.96, '2025-01-11 10:45:00'),
      ('David Miller', 'Budget Solution', 2, 49.99, 99.98, '2025-01-15 15:20:00'),
      ('Sarah Davis', 'Budget Solution', 3, 49.99, 149.97, '2025-01-19 11:35:00'),
      ('Jacob Garcia', 'Budget Solution', 5, 49.99, 249.95, '2025-01-23 16:50:00'),
      ('Emily Rodriguez', 'Budget Solution', 3, 49.99, 149.97, '2025-01-27 13:05:00'),
      ('Matthew Martinez', 'Budget Solution', 2, 49.99, 99.98, '2025-01-31 09:25:00');
    
    -- March: Higher Premium Widget sales (Spring upgrades)
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      ('Christopher Lee', 'Premium Widget', 2, 149.99, 299.98, '2025-03-02 14:10:00'),
      ('Amanda Walker', 'Premium Widget', 1, 149.99, 149.99, '2025-03-06 10:25:00'),
      ('Daniel Hall', 'Premium Widget', 3, 149.99, 449.97, '2025-03-10 15:40:00'),
      ('Jessica Young', 'Premium Widget', 2, 149.99, 299.98, '2025-03-14 11:55:00'),
      ('Andrew Allen', 'Premium Widget', 1, 149.99, 149.99, '2025-03-18 16:30:00'),
      ('Megan King', 'Premium Widget', 2, 149.99, 299.98, '2025-03-22 13:45:00'),
      ('Justin Wright', 'Premium Widget', 3, 149.99, 449.97, '2025-03-26 09:00:00'),
      ('Lauren Scott', 'Premium Widget', 2, 149.99, 299.98, '2025-03-30 14:15:00');
    
    -- April: Higher Enterprise Suite sales (Q2 business planning)
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      ('Nicholas Green', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-03 10:30:00'),
      ('Olivia Baker', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-07 15:45:00'),
      ('Tyler Adams', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-11 12:00:00'),
      ('Rachel Nelson', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-15 08:15:00'),
      ('Brandon Carter', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-19 13:30:00'),
      ('Samantha Mitchell', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-23 09:45:00'),
      ('Kevin Perez', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-27 14:00:00');
      
    RAISE NOTICE 'Added additional sales data with customer segments and trends';
  ELSE
    RAISE NOTICE 'Skipping additional sales data insertion - database already has sufficient records';
  END IF;
END $$;

-- Update sequence if necessary
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_sequences WHERE sequencename = 'sales_order_id_seq'
  ) THEN
    EXECUTE 'SELECT setval(''sales_order_id_seq'', COALESCE((SELECT MAX(order_id) FROM sales), 0) + 1, false)';
    RAISE NOTICE 'Updated sales_order_id_seq sequence';
  END IF;
END $$;

COMMIT;
