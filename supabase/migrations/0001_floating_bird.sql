/*
  # Initial Schema for RideShare Application

  1. New Tables
    - `profiles`
      - Extended user profile information
      - Linked to auth.users via user_id
      - Stores name, phone, bio, avatar_url
    
    - `rides`
      - Stores ride offerings
      - Contains route, schedule, price, available seats
      - Links to driver (profiles) via driver_id
    
    - `bookings`
      - Manages ride bookings
      - Links passengers to rides
      - Tracks booking status

  2. Security
    - Enable RLS on all tables
    - Policies for CRUD operations based on user roles
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rides table
CREATE TABLE rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  available_seats int NOT NULL CHECK (available_seats > 0),
  price decimal NOT NULL CHECK (price >= 0),
  car_model text,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seats_booked int NOT NULL CHECK (seats_booked > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Rides are viewable by everyone"
  ON rides FOR SELECT
  USING (true);

CREATE POLICY "Users can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own rides"
  ON rides FOR UPDATE
  USING (auth.uid() = driver_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = passenger_id OR 
    auth.uid() IN (
      SELECT driver_id FROM rides WHERE id = ride_id
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = passenger_id);