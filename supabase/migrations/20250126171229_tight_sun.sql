/*
  # Add driver locations tracking

  1. New Tables
    - `driver_locations`
      - `driver_id` (uuid, primary key)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `heading` (double precision, nullable)
      - `speed` (double precision, nullable)
      - `last_updated` (timestamptz)

  2. Functions
    - `get_nearby_drivers`: Finds drivers within a specified radius
    
  3. Security
    - Enable RLS on `driver_locations` table
    - Add policies for location updates and viewing
*/

-- Create driver_locations table
CREATE TABLE driver_locations (
  driver_id uuid PRIMARY KEY REFERENCES profiles(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can update their own location"
  ON driver_locations FOR ALL
  USING (auth.uid() = driver_id);

CREATE POLICY "Anyone can view driver locations"
  ON driver_locations FOR SELECT
  USING (true);

-- Create function to get nearby drivers
CREATE OR REPLACE FUNCTION get_nearby_drivers(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision
)
RETURNS TABLE (
  driver_id uuid,
  latitude double precision,
  longitude double precision,
  heading double precision,
  speed double precision,
  last_updated timestamptz,
  profiles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.driver_id,
    dl.latitude,
    dl.longitude,
    dl.heading,
    dl.speed,
    dl.last_updated,
    jsonb_build_object(
      'name', p.name,
      'avatar_url', p.avatar_url
    ) as profiles
  FROM driver_locations dl
  JOIN profiles p ON p.id = dl.driver_id
  WHERE
    earth_box(ll_to_earth(p_latitude, p_longitude), p_radius_km * 1000) @> ll_to_earth(dl.latitude, dl.longitude)
    AND earth_distance(ll_to_earth(p_latitude, p_longitude), ll_to_earth(dl.latitude, dl.longitude)) <= p_radius_km * 1000;
END;
$$;

-- Create index for spatial queries
CREATE INDEX idx_driver_locations_coords ON driver_locations USING gist (ll_to_earth(latitude, longitude));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_nearby_drivers TO authenticated;