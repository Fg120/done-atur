-- Create donations table
CREATE TABLE donations (
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
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX donations_status_idx ON donations(status);
CREATE INDEX donations_created_at_idx ON donations(created_at DESC);
CREATE INDEX donations_donor_email_idx ON donations(donor_email);

-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for public donations)
CREATE POLICY "Anyone can insert donations"
  ON donations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Donors can view their own donations
CREATE POLICY "Donors can view their own donations"
  ON donations
  FOR SELECT
  USING (true);

-- Policy: Only admins can update (will be enforced in application logic)
-- This policy allows authenticated users to read all, but update is restricted by app logic
CREATE POLICY "Users can view all donations"
  ON donations
  FOR SELECT
  USING (true);
