-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pria', 'wanita', 'anak')),
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('baru','preloved')),
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  photo_urls TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);

-- Enable RLS
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public read access
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  USING (true);

-- Service role can do everything
DROP POLICY IF EXISTS "Service role full access" ON products;
CREATE POLICY "Service role full access"
  ON products
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

