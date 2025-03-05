-- Transaction wrapper to ensure all operations succeed or fail as a unit
BEGIN;

-- Check if table exists first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE sales (
      order_id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      product VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      sale_date TIMESTAMP NOT NULL
    );
    
    -- Create indexes
    CREATE INDEX idx_sales_date ON sales(sale_date);
    CREATE INDEX idx_sales_product ON sales(product);
    CREATE INDEX idx_sales_customer ON sales(customer_name);

    -- Insert sample data
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      ('Lauren Smith', 'Mouse', 3, 30.00, 90.00, '2025-01-28 13:50:17'),
      ('John Mason', 'Headphones', 2, 100.00, 200.00, '2025-02-10 16:28:19'),
      ('Thomas Melton', 'Headphones', 5, 100.00, 500.00, '2025-02-14 04:15:03'),
      ('Jamie Anderson', 'Headphones', 4, 100.00, 400.00, '2025-01-30 17:29:33'),
      ('Kenneth Baker', 'Laptop', 3, 800.00, 2400.00, '2025-01-22 13:32:57'),
      ('Matthew Foster', 'Mouse', 5, 30.00, 150.00, '2025-02-06 23:11:00'),
      ('Peter Trevino', 'Laptop', 5, 800.00, 4000.00, '2025-01-26 22:34:20'),
      ('Alyssa Cobb', 'Headphones', 5, 100.00, 500.00, '2025-01-24 07:25:20'),
      ('Lisa Collier', 'Laptop', 5, 800.00, 4000.00, '2025-01-28 04:40:01'),
      ('Frank Juarez', 'Headphones', 4, 100.00, 400.00, '2025-01-24 07:58:00'),
      ('Sarah Duncan', 'Mouse', 4, 30.00, 120.00, '2025-02-04 21:48:26'),
      ('Michael Wood', 'Smartphone', 5, 500.00, 2500.00, '2025-02-02 08:21:17'),
      ('James Richardson', 'Keyboard', 5, 50.00, 250.00, '2025-01-27 20:06:18'),
      ('Leah Owens', 'Monitor', 3, 300.00, 900.00, '2025-02-03 19:07:02'),
      ('Rachel Espinoza', 'Monitor', 4, 300.00, 1200.00, '2025-02-10 22:15:43'),
      ('Keith Lewis', 'Monitor', 4, 300.00, 1200.00, '2025-01-25 02:28:23'),
      ('Carla Reed', 'Keyboard', 5, 50.00, 250.00, '2025-02-16 06:04:51'),
      ('Donna Wood', 'Headphones', 4, 100.00, 400.00, '2025-02-04 20:57:03'),
      ('Daniel Case', 'Headphones', 3, 100.00, 300.00, '2025-01-30 13:23:22'),
      ('Zachary Gonzalez', 'Keyboard', 4, 50.00, 200.00, '2025-02-16 20:13:21');
      
    RAISE NOTICE 'Created sales table with sample data';
  ELSE
    -- Table exists, check if columns exist and add them if they don't
    DO $COLS$ 
    BEGIN
      -- Check for price column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'price'
      ) THEN
        ALTER TABLE sales ADD COLUMN price DECIMAL(10, 2);
        RAISE NOTICE 'Added price column to existing sales table';
      END IF;

      -- Check for quantity column
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'quantity'
      ) THEN
        ALTER TABLE sales ADD COLUMN quantity INTEGER;
        RAISE NOTICE 'Added quantity column to existing sales table';
      END IF;
    END $COLS$;
    
    -- Create indexes if they don't exist
    DO $INDEXES$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_date'
      ) THEN
        CREATE INDEX idx_sales_date ON sales(sale_date);
      END IF;
      
      IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_product'
      ) THEN
        CREATE INDEX idx_sales_product ON sales(product);
      END IF;
      
      IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_customer'
      ) THEN
        CREATE INDEX idx_sales_customer ON sales(customer_name);
      END IF;
    END $INDEXES$;
    
    -- Insert sample data only if table is empty
    IF NOT EXISTS (SELECT 1 FROM sales LIMIT 1) THEN
      -- We need to use the column list that actually exists in the table
      INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
      VALUES
        ('Lauren Smith', 'Mouse', 3, 30.00, 90.00, '2025-01-28 13:50:17'),
        ('John Mason', 'Headphones', 2, 100.00, 200.00, '2025-02-10 16:28:19'),
        ('Thomas Melton', 'Headphones', 5, 100.00, 500.00, '2025-02-14 04:15:03'),
        ('Jamie Anderson', 'Headphones', 4, 100.00, 400.00, '2025-01-30 17:29:33'),
        ('Kenneth Baker', 'Laptop', 3, 800.00, 2400.00, '2025-01-22 13:32:57');
      
      RAISE NOTICE 'Added sample data to existing sales table';
    END IF;
  END IF;
END $$;

-- Ensure sequence is up-to-date
SELECT setval('sales_order_id_seq', COALESCE((SELECT MAX(order_id) FROM sales), 0) + 1, false);

COMMIT;
