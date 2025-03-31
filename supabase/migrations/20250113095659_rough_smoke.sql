/*
  # Fix chat table and policies

  1. Changes
    - Add safety checks for existing policies
    - Recreate policies only if they don't exist
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Chat participants can view messages" ON chats;
    DROP POLICY IF EXISTS "Chat participants can send messages" ON chats;
    DROP POLICY IF EXISTS "Users can mark received messages as read" ON chats;
EXCEPTION
    WHEN undefined_table THEN
        -- Create the table if it doesn't exist
        CREATE TABLE IF NOT EXISTS chats (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
            sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            message text NOT NULL,
            created_at timestamptz DEFAULT now(),
            read boolean DEFAULT false
        );

        ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
END $$;

-- Recreate policies
DO $$ 
BEGIN
    -- View messages policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' 
        AND policyname = 'Chat participants can view messages'
    ) THEN
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
    END IF;

    -- Send messages policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' 
        AND policyname = 'Chat participants can send messages'
    ) THEN
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
    END IF;

    -- Mark messages as read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chats' 
        AND policyname = 'Users can mark received messages as read'
    ) THEN
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
    END IF;
END $$;