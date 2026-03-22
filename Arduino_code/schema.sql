-- Create the sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Depending on your setup, you might want to create RLS policies
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to view data (for dashboard testing)
CREATE POLICY "Allow anon select" ON sensor_readings 
FOR SELECT TO anon USING (true);

-- Allow anonymous users to insert data (for ESP32 testing)
CREATE POLICY "Allow anon insert" ON sensor_readings 
FOR INSERT TO anon WITH CHECK (true);

-- Enable Realtime for the sensor_readings table
-- This allows the dashboard to receive websocket updates when ESP32 inserts data
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;