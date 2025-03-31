/*
  # Add chat functionality

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `sender_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamp)
      - `read` (boolean)

  2. Security
    - Enable RLS on `chats` table
    - Add policies for chat participants
*/

CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Allow chat participants to view messages
CREATE POLICY "Chat participants can view messages"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE b.id = chats.booking_id
      AND (
        auth.uid() = b.passenger_id OR
        auth.uid() = r.driver_id
      )
    )
  );

-- Allow chat participants to send messages
CREATE POLICY "Chat participants can send messages"
  ON chats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE b.id = booking_id
      AND (
        auth.uid() = b.passenger_id OR
        auth.uid() = r.driver_id
      )
    )
  );

-- Allow users to mark their received messages as read
CREATE POLICY "Users can mark received messages as read"
  ON chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE b.id = chats.booking_id
      AND (
        (auth.uid() = b.passenger_id AND r.driver_id = chats.sender_id) OR
        (auth.uid() = r.driver_id AND b.passenger_id = chats.sender_id)
      )
    )
  );