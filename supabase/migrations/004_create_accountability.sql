-- Create accountability/pertanggungjawaban table
CREATE TABLE IF NOT EXISTS accountability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  activity_date DATE NOT NULL,
  description TEXT NOT NULL,
  donation_ids UUID[] NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_accountability_created_by ON accountability(created_by);
CREATE INDEX IF NOT EXISTS idx_accountability_activity_date ON accountability(activity_date);
CREATE INDEX IF NOT EXISTS idx_accountability_created_at ON accountability(created_at);

-- Enable RLS
ALTER TABLE accountability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view accountability" ON accountability;
CREATE POLICY "Public can view accountability"
  ON accountability
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can create accountability" ON accountability;
CREATE POLICY "Admin can create accountability"
  ON accountability
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin can update accountability" ON accountability;
CREATE POLICY "Admin can update accountability"
  ON accountability
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin can delete accountability" ON accountability;
CREATE POLICY "Admin can delete accountability"
  ON accountability
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access accountability" ON accountability;
CREATE POLICY "Service role full access accountability"
  ON accountability
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);
