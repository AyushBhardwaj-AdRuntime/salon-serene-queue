export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          avg_wait_time_minutes: number | null
          created_at: string
          date: string
          id: string
          peak_hour: number | null
          salon_id: string
          total_customers: number
        }
        Insert: {
          avg_wait_time_minutes?: number | null
          created_at?: string
          date: string
          id?: string
          peak_hour?: number | null
          salon_id: string
          total_customers?: number
        }
        Update: {
          avg_wait_time_minutes?: number | null
          created_at?: string
          date?: string
          id?: string
          peak_hour?: number | null
          salon_id?: string
          total_customers?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_time: string
          created_at: string
          customer_name: string
          estimated_duration_minutes: number
          id: string
          notes: string | null
          phone_number: string | null
          salon_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_time: string
          created_at?: string
          customer_name: string
          estimated_duration_minutes?: number
          id?: string
          notes?: string | null
          phone_number?: string | null
          salon_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_time?: string
          created_at?: string
          customer_name?: string
          estimated_duration_minutes?: number
          id?: string
          notes?: string | null
          phone_number?: string | null
          salon_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_name: string
          estimated_duration_minutes: number
          id: string
          phone_number: string | null
          queue_number: number
          request_status: Database["public"]["Enums"]["queue_request_status"]
          salon_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          estimated_duration_minutes?: number
          id?: string
          phone_number?: string | null
          queue_number?: number
          request_status?: Database["public"]["Enums"]["queue_request_status"]
          salon_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          estimated_duration_minutes?: number
          id?: string
          phone_number?: string | null
          queue_number?: number
          request_status?: Database["public"]["Enums"]["queue_request_status"]
          salon_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_analytics: {
        Row: {
          created_at: string
          customer_count: number
          date: string
          hour: number
          id: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          customer_count?: number
          date: string
          hour: number
          id?: string
          salon_id: string
        }
        Update: {
          created_at?: string
          customer_count?: number
          date?: string
          hour?: number
          id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hourly_analytics_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_members: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          lifetime_points: number
          phone_number: string
          salon_id: string
          total_points: number
          total_visits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          lifetime_points?: number
          phone_number: string
          salon_id: string
          total_points?: number
          total_visits?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          lifetime_points?: number
          phone_number?: string
          salon_id?: string
          total_points?: number
          total_visits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string | null
          feedback: string | null
          id: string
          rating: number
          salon_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          feedback?: string | null
          id?: string
          rating: number
          salon_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          id: string
          loyalty_member_id: string
          points_used: number
          redeemed_at: string
          reward_id: string
          salon_id: string
          status: string
        }
        Insert: {
          id?: string
          loyalty_member_id: string
          points_used: number
          redeemed_at?: string
          reward_id: string
          salon_id: string
          status?: string
        }
        Update: {
          id?: string
          loyalty_member_id?: string
          points_used?: number
          redeemed_at?: string
          reward_id?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_loyalty_member_id_fkey"
            columns: ["loyalty_member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          points_required: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_required: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_required?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_staff: {
        Row: {
          created_at: string
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          id: string
          is_open: boolean
          is_queue_paused: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_time: string | null
          owner_id: string
          priority_mode: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          id?: string
          is_open?: boolean
          is_queue_paused?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_time?: string | null
          owner_id: string
          priority_mode?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          id?: string
          is_open?: boolean
          is_queue_paused?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_time?: string | null
          owner_id?: string
          priority_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_analytics: {
        Row: {
          count: number
          created_at: string
          date: string
          id: string
          salon_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          count?: number
          created_at?: string
          date: string
          id?: string
          salon_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          salon_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: [
          {
            foreignKeyName: "service_analytics_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_history: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          loyalty_member_id: string
          notes: string | null
          points_earned: number
          salon_id: string
          service_type: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          loyalty_member_id: string
          notes?: string | null
          points_earned?: number
          salon_id: string
          service_type: string
          visit_date?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          loyalty_member_id?: string
          notes?: string | null
          points_earned?: number
          salon_id?: string
          service_type?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_history_loyalty_member_id_fkey"
            columns: ["loyalty_member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_history_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_queue: {
        Args: { _salon_ids?: string[] }
        Returns: {
          created_at: string
          estimated_duration_minutes: number
          id: string
          queue_number: number
          request_status: Database["public"]["Enums"]["queue_request_status"]
          salon_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }[]
      }
      get_salon_avg_rating: { Args: { salon_uuid: string }; Returns: number }
      get_salon_rating_count: { Args: { salon_uuid: string }; Returns: number }
      is_salon_staff: {
        Args: { _salon_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      queue_request_status: "pending" | "approved" | "rejected"
      queue_status: "Waiting" | "Serving" | "Done"
      service_type:
        | "Haircut"
        | "Shave"
        | "Facial"
        | "Hair Color"
        | "Beard Trim"
        | "Full Package"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      queue_request_status: ["pending", "approved", "rejected"],
      queue_status: ["Waiting", "Serving", "Done"],
      service_type: [
        "Haircut",
        "Shave",
        "Facial",
        "Hair Color",
        "Beard Trim",
        "Full Package",
      ],
    },
  },
} as const
