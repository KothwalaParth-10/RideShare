export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          driver_id: string
          from_location: string
          to_location: string
          departure_date: string
          departure_time: string
          available_seats: number
          price: number
          car_model: string | null
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          from_location: string
          to_location: string
          departure_date: string
          departure_time: string
          available_seats: number
          price: number
          car_model?: string | null
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          from_location?: string
          to_location?: string
          departure_date?: string
          departure_time?: string
          available_seats?: number
          price?: number
          car_model?: string | null
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          ride_id: string
          passenger_id: string
          seats_booked: number
          status: string
          request_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ride_id: string
          passenger_id: string
          seats_booked: number
          status?: string
          request_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ride_id?: string
          passenger_id?: string
          seats_booked?: number
          status?: string
          request_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          booking_id: string
          sender_id: string
          message: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          booking_id: string
          sender_id: string
          message: string
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          booking_id?: string
          sender_id?: string
          message?: string
          created_at?: string
          read?: boolean
        }
      }
    }
  }
}