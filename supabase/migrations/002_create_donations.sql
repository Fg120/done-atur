-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(20) NOT NULL,
  donation_type VARCHAR(50) NOT NULL CHECK (donation_type IN ('uang', 'pakaian')),
  
  -- For money donations
  nominal DECIMAL(12, 2),
  net_amount DECIMAL(12, 2),
  payment_method VARCHAR(50),
  transfer_proof_url VARCHAR(500),
  
  -- For clothing donations
  clothing_list TEXT,
  pickup_address TEXT,
  
  -- Common fields
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS donations_status_idx ON donations(status);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS donations_donor_email_idx ON donations(donor_email);
CREATE INDEX IF NOT EXISTS donations_donor_phone_idx ON donations(donor_phone);

-- Enable RLS
ALTER TABLE IF EXISTS donations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for public donations)
DROP POLICY IF EXISTS "Anyone can insert donations" ON donations;
CREATE POLICY "Anyone can insert donations"
  ON donations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can view all donations (public data)
DROP POLICY IF EXISTS "View own donations with email or phone" ON donations;
DROP POLICY IF EXISTS "Users can view all donations" ON donations;
CREATE POLICY "Anyone can view donations"
  ON donations
  FOR SELECT
  USING (true);

-- Policy: Only service role can update donations
DROP POLICY IF EXISTS "Admins can update donations" ON donations;
CREATE POLICY "Service role can update donations"
  ON donations
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only service role can delete donations
DROP POLICY IF EXISTS "Admins can delete donations" ON donations;
CREATE POLICY "Service role can delete donations"
  ON donations
  FOR DELETE
  USING (auth.role() = 'service_role');
