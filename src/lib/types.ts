export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ReviewBlock =
  | { type: 'heading'; content: string }
  | { type: 'text'; content: string }
  | { type: 'photo'; key: number; url: string; caption?: string | null }

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          lat: number | null
          lng: number | null
          is_chain: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          lat?: number | null
          lng?: number | null
          is_chain?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          food_category: string | null
          onboarding_done: boolean
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string
          food_category?: string | null
          onboarding_done?: boolean
          avatar_url?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>
      }
      rubric_axes: {
        Row: {
          id: string
          user_id: string
          label: string
          description: string | null
          weight: number
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          description?: string | null
          weight?: number
          position?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['rubric_axes']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          location_id: string
          user_id: string
          composite: number | null
          notes: string | null
          body: ReviewBlock[] | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          user_id: string
          composite?: number | null
          notes?: string | null
          body?: ReviewBlock[] | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      review_scores: {
        Row: {
          id: string
          review_id: string
          axis_id: string
          score: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          axis_id: string
          score: number
          note?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_scores']['Insert']>
      }
      review_photos: {
        Row: {
          id: string
          review_id: string
          photo_url: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          photo_url: string
          order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_photos']['Insert']>
      }
      comments: {
        Row: {
          id: string
          location_id: string
          user_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          user_id: string
          body: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
    }
    Views: {
      location_scores: {
        Row: {
          id: string
          location_name: string
          location_city: string
          address: string
          is_chain: boolean
          avg_composite: number | null
          review_count: number
          tier: string | null
          created_at: string
        }
      }
    }
  }
}

export type Location      = Database['public']['Tables']['locations']['Row']
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type RubricAxis    = Database['public']['Tables']['rubric_axes']['Row']
export type Review        = Database['public']['Tables']['reviews']['Row']
export type ReviewScore   = Database['public']['Tables']['review_scores']['Row']
export type ReviewPhoto   = Database['public']['Tables']['review_photos']['Row']
export type Comment       = Database['public']['Tables']['comments']['Row']
export type LocationScore = Database['public']['Views']['location_scores']['Row']

// Legacy aliases kept so WrapCard / rankings still compile during transition
export type WrapScore = LocationScore & { name: string; photo_url: string | null; location_id: string; price: number | null }
