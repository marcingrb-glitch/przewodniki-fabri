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
      automats: {
        Row: {
          code: string
          created_at: string
          has_seat_legs: boolean
          id: string
          name: string
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string
          has_seat_legs?: boolean
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          has_seat_legs?: boolean
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      backrests: {
        Row: {
          allowed_finishes: string[] | null
          code: string
          created_at: string
          default_finish: string | null
          foam: string | null
          frame: string | null
          height_cm: string | null
          id: string
          series_id: string
          top: string | null
        }
        Insert: {
          allowed_finishes?: string[] | null
          code: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          height_cm?: string | null
          id?: string
          series_id: string
          top?: string | null
        }
        Update: {
          allowed_finishes?: string[] | null
          code?: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          height_cm?: string | null
          id?: string
          series_id?: string
          top?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backrests_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      chests: {
        Row: {
          code: string
          created_at: string
          id: string
          leg_height_cm: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          leg_height_cm?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          leg_height_cm?: number
          name?: string
        }
        Relationships: []
      }
      extras: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          series_id: string
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          series_id: string
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          series_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extras_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          code: string
          colors: Json
          created_at: string
          id: string
          name: string
          price_group: number
        }
        Insert: {
          code: string
          colors?: Json
          created_at?: string
          id?: string
          name: string
          price_group?: number
        }
        Update: {
          code?: string
          colors?: Json
          created_at?: string
          id?: string
          name?: string
          price_group?: number
        }
        Relationships: []
      }
      finishes: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      jaskis: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      legs: {
        Row: {
          code: string
          colors: Json
          created_at: string
          id: string
          material: string | null
          name: string
          series_id: string
        }
        Insert: {
          code: string
          colors?: Json
          created_at?: string
          id?: string
          material?: string | null
          name: string
          series_id: string
        }
        Update: {
          code?: string
          colors?: Json
          created_at?: string
          id?: string
          material?: string | null
          name?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legs_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string
          file_url: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type: string
          file_url: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          file_url?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          decoded_data: Json | null
          id: string
          order_date: string
          order_number: string
          series_code: string | null
          sku: string
        }
        Insert: {
          created_at?: string
          decoded_data?: Json | null
          id?: string
          order_date?: string
          order_number: string
          series_code?: string | null
          sku: string
        }
        Update: {
          created_at?: string
          decoded_data?: Json | null
          id?: string
          order_date?: string
          order_number?: string
          series_code?: string | null
          sku?: string
        }
        Relationships: []
      }
      pillows: {
        Row: {
          allowed_finishes: string[] | null
          code: string
          created_at: string
          default_finish: string | null
          id: string
          name: string
        }
        Insert: {
          allowed_finishes?: string[] | null
          code: string
          created_at?: string
          default_finish?: string | null
          id?: string
          name: string
        }
        Update: {
          allowed_finishes?: string[] | null
          code?: string
          created_at?: string
          default_finish?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      seats_pufa: {
        Row: {
          base_foam: string | null
          box_height: string | null
          code: string
          created_at: string
          front_back: string | null
          id: string
          series_id: string
          sides: string | null
        }
        Insert: {
          base_foam?: string | null
          box_height?: string | null
          code: string
          created_at?: string
          front_back?: string | null
          id?: string
          series_id: string
          sides?: string | null
        }
        Update: {
          base_foam?: string | null
          box_height?: string | null
          code?: string
          created_at?: string
          front_back?: string | null
          id?: string
          series_id?: string
          sides?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_pufa_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      seats_sofa: {
        Row: {
          allowed_finishes: string[] | null
          center_strip: boolean
          code: string
          created_at: string
          default_finish: string | null
          foam: string | null
          frame: string | null
          front: string | null
          id: string
          series_id: string
          type: string | null
        }
        Insert: {
          allowed_finishes?: string[] | null
          center_strip?: boolean
          code: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          front?: string | null
          id?: string
          series_id: string
          type?: string | null
        }
        Update: {
          allowed_finishes?: string[] | null
          center_strip?: boolean
          code?: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          front?: string | null
          id?: string
          series_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_sofa_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          code: string
          collection: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          collection?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          collection?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sides: {
        Row: {
          allowed_finishes: string[] | null
          code: string
          created_at: string
          default_finish: string | null
          frame: string | null
          id: string
          name: string
          series_id: string
        }
        Insert: {
          allowed_finishes?: string[] | null
          code: string
          created_at?: string
          default_finish?: string | null
          frame?: string | null
          id?: string
          name: string
          series_id: string
        }
        Update: {
          allowed_finishes?: string[] | null
          code?: string
          created_at?: string
          default_finish?: string | null
          frame?: string | null
          id?: string
          name?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sides_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      waleks: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
