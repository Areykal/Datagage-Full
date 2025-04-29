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

    -- Insert sample data with dates leading up to current (April 2025)
    INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
    VALUES
      -- January 2025
      ('Lauren Smith', 'Premium Widget', 3, 149.99, 449.97, '2025-01-05 13:50:17'),
      ('John Mason', 'Standard Package', 2, 89.99, 179.98, '2025-01-10 16:28:19'),
      ('Thomas Melton', 'Enterprise Suite', 1, 999.99, 999.99, '2025-01-14 04:15:03'),
      ('Jamie Anderson', 'Standard Package', 4, 89.99, 359.96, '2025-01-18 17:29:33'),
      ('Kenneth Baker', 'Premium Widget', 2, 149.99, 299.98, '2025-01-22 13:32:57'),
      ('Matthew Foster', 'Budget Solution', 5, 49.99, 249.95, '2025-01-26 23:11:00'),
      ('Peter Trevino', 'Enterprise Suite', 1, 999.99, 999.99, '2025-01-29 22:34:20'),
      
      -- February 2025
      ('Alyssa Cobb', 'Standard Package', 3, 89.99, 269.97, '2025-02-03 07:25:20'),
      ('Lisa Collier', 'Premium Widget', 2, 149.99, 299.98, '2025-02-07 04:40:01'),
      ('Frank Juarez', 'Budget Solution', 4, 49.99, 199.96, '2025-02-11 07:58:00'),
      ('Sarah Duncan', 'Starter Kit', 4, 29.99, 119.96, '2025-02-14 21:48:26'),
      ('Michael Wood', 'Enterprise Suite', 1, 999.99, 999.99, '2025-02-18 08:21:17'),
      ('James Richardson', 'Standard Package', 2, 89.99, 179.98, '2025-02-22 20:06:18'),
      ('Leah Owens', 'Premium Widget', 3, 149.99, 449.97, '2025-02-26 19:07:02'),
      
      -- March 2025
      ('Rachel Espinoza', 'Budget Solution', 4, 49.99, 199.96, '2025-03-02 22:15:43'),
      ('Keith Lewis', 'Starter Kit', 5, 29.99, 149.95, '2025-03-05 02:28:23'),
      ('Carla Reed', 'Premium Widget', 1, 149.99, 149.99, '2025-03-09 06:04:51'),
      ('Donna Wood', 'Standard Package', 3, 89.99, 269.97, '2025-03-13 20:57:03'),
      ('Daniel Case', 'Enterprise Suite', 1, 999.99, 999.99, '2025-03-17 13:23:22'),
      ('Zachary Gonzalez', 'Budget Solution', 4, 49.99, 199.96, '2025-03-21 20:13:21'),
      ('Emma Wilson', 'Starter Kit', 2, 29.99, 59.98, '2025-03-24 14:45:33'),
      ('Tyler Rodriguez', 'Premium Widget', 2, 149.99, 299.98, '2025-03-28 09:12:05'),
      
      -- April 2025 (current month)
      ('Sophie Johnson', 'Standard Package', 3, 89.99, 269.97, '2025-04-01 11:22:33'),
      ('Andrew Davis', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-04 15:38:42'),
      ('Olivia Martinez', 'Budget Solution', 5, 49.99, 249.95, '2025-04-07 08:19:27'),
      ('Ethan Thompson', 'Premium Widget', 2, 149.99, 299.98, '2025-04-11 17:05:14'),
      ('Isabella Wright', 'Starter Kit', 6, 29.99, 179.94, '2025-04-14 12:33:51'),
      ('Noah Miller', 'Standard Package', 1, 89.99, 89.99, '2025-04-17 10:27:39'),
      ('Sophia Anderson', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-20 14:52:08'),
      ('William Taylor', 'Premium Widget', 3, 149.99, 449.97, '2025-04-23 09:41:15'),
      ('Ava Thomas', 'Budget Solution', 4, 49.99, 199.96, '2025-04-25 16:30:22'),
      ('Acme Corporation', 'Enterprise Suite', 2, 999.99, 1999.98, '2025-04-26 08:15:00');
      
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
    DECLARE
      date_column_name TEXT;
    BEGIN
      -- First determine which date column exists in the table
      SELECT column_name INTO date_column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'sales' 
      AND column_name IN ('sale_date', 'order_date', 'transaction_date', 'date')
      LIMIT 1;
      
      IF date_column_name IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_date'
        ) THEN
          EXECUTE format('CREATE INDEX idx_sales_date ON sales(%I)', date_column_name);
          RAISE NOTICE 'Created date index on column %', date_column_name;
        END IF;
      ELSE
        RAISE NOTICE 'No suitable date column found for indexing';
      END IF;
      
      -- Check if product column exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'product'
      ) AND NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_product'
      ) THEN
        CREATE INDEX idx_sales_product ON sales(product);
        RAISE NOTICE 'Created product index';
      END IF;
      
      -- Check for various possible customer column names
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'customer_name'
      ) AND NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_customer'
      ) THEN
        CREATE INDEX idx_sales_customer ON sales(customer_name);
        RAISE NOTICE 'Created customer index';
      ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'customer'
      ) AND NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'sales' AND indexname = 'idx_sales_customer'
      ) THEN
        CREATE INDEX idx_sales_customer ON sales(customer);
        RAISE NOTICE 'Created customer index';
      END IF;
    END $INDEXES$;
    
    -- Insert sample data only if table is empty
    IF NOT EXISTS (SELECT 1 FROM sales LIMIT 1) THEN
      -- We need to use the column list that actually exists in the table
      INSERT INTO sales (customer_name, product, quantity, price, total, sale_date)
      VALUES
        -- January 2025
        ('Lauren Smith', 'Premium Widget', 3, 149.99, 449.97, '2025-01-05 13:50:17'),
        ('John Mason', 'Standard Package', 2, 89.99, 179.98, '2025-01-10 16:28:19'),
        ('Thomas Melton', 'Enterprise Suite', 1, 999.99, 999.99, '2025-01-14 04:15:03'),
        ('Jamie Anderson', 'Standard Package', 4, 89.99, 359.96, '2025-01-18 17:29:33'),
        ('Kenneth Baker', 'Premium Widget', 2, 149.99, 299.98, '2025-01-22 13:32:57'),
        
        -- More recent transactions up to April 2025
        ('Sophia Anderson', 'Enterprise Suite', 1, 999.99, 999.99, '2025-04-20 14:52:08'),
        ('William Taylor', 'Premium Widget', 3, 149.99, 449.97, '2025-04-23 09:41:15'),
        ('Ava Thomas', 'Budget Solution', 4, 49.99, 199.96, '2025-04-25 16:30:22'),
        ('Acme Corporation', 'Enterprise Suite', 2, 999.99, 1999.98, '2025-04-26 08:15:00');
      
      RAISE NOTICE 'Added sample data to existing sales table';
    END IF;
  END IF;
END $$;

-- Ensure sequence is up-to-date (if order_id exists)
DO $$ 
BEGIN
  -- Only update sequence if order_id column exists and it uses a sequence
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'order_id'
  ) AND EXISTS (
    SELECT FROM pg_sequences WHERE sequencename = 'sales_order_id_seq'
  ) THEN
    EXECUTE 'SELECT setval(''sales_order_id_seq'', COALESCE((SELECT MAX(order_id) FROM sales), 0) + 1, false)';
    RAISE NOTICE 'Updated sales_order_id_seq sequence';
  ELSE
    RAISE NOTICE 'Either order_id column or sales_order_id_seq does not exist, skipping sequence update';
  END IF;
END $$;

COMMIT;
