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
          id: string
          name: string
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string
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
          model_name: string | null
          series_id: string
          spring_type: string | null
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
          model_name?: string | null
          series_id: string
          spring_type?: string | null
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
          model_name?: string | null
          series_id?: string
          spring_type?: string | null
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
          leg_count: number | null
          leg_height_cm: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          leg_count?: number | null
          leg_height_cm?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          leg_count?: number | null
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
      label_templates: {
        Row: {
          component: string
          condition_field: string | null
          content_template: string
          created_at: string
          display_fields: string[]
          id: string
          is_conditional: boolean
          label_name: string
          product_type: string
          quantity: number
          series_id: string | null
          sort_order: number
        }
        Insert: {
          component: string
          condition_field?: string | null
          content_template: string
          created_at?: string
          display_fields?: string[]
          id?: string
          is_conditional?: boolean
          label_name: string
          product_type: string
          quantity?: number
          series_id?: string | null
          sort_order?: number
        }
        Update: {
          component?: string
          condition_field?: string | null
          content_template?: string
          created_at?: string
          display_fields?: string[]
          id?: string
          is_conditional?: boolean
          label_name?: string
          product_type?: string
          quantity?: number
          series_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "label_templates_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      legs: {
        Row: {
          code: string
          colors: Json
          completed_by: string | null
          created_at: string
          id: string
          material: string | null
          name: string
        }
        Insert: {
          code: string
          colors?: Json
          completed_by?: string | null
          created_at?: string
          id?: string
          material?: string | null
          name: string
        }
        Update: {
          code?: string
          colors?: Json
          completed_by?: string | null
          created_at?: string
          id?: string
          material?: string | null
          name?: string
        }
        Relationships: []
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
          created_by: string | null
          decoded_data: Json | null
          id: string
          mimeeq_shortcode: string | null
          order_date: string
          order_number: string
          series_code: string | null
          shopify_order_name: string | null
          sku: string
          variant_image_path: string | null
          variant_image_url: string | null
          visible_to_workers: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decoded_data?: Json | null
          id?: string
          mimeeq_shortcode?: string | null
          order_date?: string
          order_number: string
          series_code?: string | null
          shopify_order_name?: string | null
          sku: string
          variant_image_path?: string | null
          variant_image_url?: string | null
          visible_to_workers?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decoded_data?: Json | null
          id?: string
          mimeeq_shortcode?: string | null
          order_date?: string
          order_number?: string
          series_code?: string | null
          shopify_order_name?: string | null
          sku?: string
          variant_image_path?: string | null
          variant_image_url?: string | null
          visible_to_workers?: boolean
        }
        Relationships: []
      }
      pillows: {
        Row: {
          allowed_finishes: string[] | null
          code: string
          construction_type: string | null
          created_at: string
          default_finish: string | null
          id: string
          name: string
        }
        Insert: {
          allowed_finishes?: string[] | null
          code: string
          construction_type?: string | null
          created_at?: string
          default_finish?: string | null
          id?: string
          name: string
        }
        Update: {
          allowed_finishes?: string[] | null
          code?: string
          construction_type?: string | null
          created_at?: string
          default_finish?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_foams: {
        Row: {
          backrest_id: string | null
          component: string
          created_at: string
          height: number | null
          id: string
          length: number | null
          material: string | null
          name: string | null
          notes: string | null
          position_number: number | null
          quantity: number | null
          seat_code: string
          series_id: string
          updated_at: string
          width: number | null
        }
        Insert: {
          backrest_id?: string | null
          component: string
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          material?: string | null
          name?: string | null
          notes?: string | null
          position_number?: number | null
          quantity?: number | null
          seat_code: string
          series_id: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          backrest_id?: string | null
          component?: string
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          material?: string | null
          name?: string | null
          notes?: string | null
          position_number?: number | null
          quantity?: number | null
          seat_code?: string
          series_id?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_foams_backrest_id_fkey"
            columns: ["backrest_id"]
            isOneToOne: false
            referencedRelation: "backrests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_foams_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      seat_pillow_mapping: {
        Row: {
          created_at: string
          id: string
          pillow_code: string
          pillow_finish: string | null
          seat_code: string
          series_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pillow_code: string
          pillow_finish?: string | null
          seat_code: string
          series_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pillow_code?: string
          pillow_finish?: string | null
          seat_code?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_pillow_mapping_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_side_compatibility: {
        Row: {
          compatible: boolean
          created_at: string
          id: string
          seat_code: string
          series_id: string
          side_code: string
        }
        Insert: {
          compatible?: boolean
          created_at?: string
          id?: string
          seat_code: string
          series_id: string
          side_code: string
        }
        Update: {
          compatible?: boolean
          created_at?: string
          id?: string
          seat_code?: string
          series_id?: string
          side_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_side_compatibility_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_types: {
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
          frame_modification: string | null
          front: string | null
          id: string
          model_name: string | null
          series_id: string
          spring_type: string | null
          type: string | null
          type_name: string | null
        }
        Insert: {
          allowed_finishes?: string[] | null
          center_strip?: boolean
          code: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          frame_modification?: string | null
          front?: string | null
          id?: string
          model_name?: string | null
          series_id: string
          spring_type?: string | null
          type?: string | null
          type_name?: string | null
        }
        Update: {
          allowed_finishes?: string[] | null
          center_strip?: boolean
          code?: string
          created_at?: string
          default_finish?: string | null
          foam?: string | null
          frame?: string | null
          frame_modification?: string | null
          front?: string | null
          id?: string
          model_name?: string | null
          series_id?: string
          spring_type?: string | null
          type?: string | null
          type_name?: string | null
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
      series_automats: {
        Row: {
          automat_code: string
          created_at: string | null
          has_seat_legs: boolean
          id: string
          seat_leg_count: number | null
          seat_leg_height_cm: number | null
          series_id: string
        }
        Insert: {
          automat_code: string
          created_at?: string | null
          has_seat_legs?: boolean
          id?: string
          seat_leg_count?: number | null
          seat_leg_height_cm?: number | null
          series_id: string
        }
        Update: {
          automat_code?: string
          created_at?: string | null
          has_seat_legs?: boolean
          id?: string
          seat_leg_count?: number | null
          seat_leg_height_cm?: number | null
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_automats_automat_code_fkey"
            columns: ["automat_code"]
            isOneToOne: false
            referencedRelation: "automats"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "series_automats_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_config: {
        Row: {
          available_chests: string[] | null
          created_at: string
          default_spring: string | null
          fixed_automat: string | null
          fixed_backrest: string | null
          fixed_chest: string | null
          id: string
          notes: string | null
          pufa_leg_count: number | null
          pufa_leg_height_cm: number | null
          pufa_leg_type: string | null
          seat_leg_height_cm: number | null
          seat_leg_type: string | null
          series_id: string
          spring_exceptions: Json | null
        }
        Insert: {
          available_chests?: string[] | null
          created_at?: string
          default_spring?: string | null
          fixed_automat?: string | null
          fixed_backrest?: string | null
          fixed_chest?: string | null
          id?: string
          notes?: string | null
          pufa_leg_count?: number | null
          pufa_leg_height_cm?: number | null
          pufa_leg_type?: string | null
          seat_leg_height_cm?: number | null
          seat_leg_type?: string | null
          series_id: string
          spring_exceptions?: Json | null
        }
        Update: {
          available_chests?: string[] | null
          created_at?: string
          default_spring?: string | null
          fixed_automat?: string | null
          fixed_backrest?: string | null
          fixed_chest?: string | null
          id?: string
          notes?: string | null
          pufa_leg_count?: number | null
          pufa_leg_height_cm?: number | null
          pufa_leg_type?: string | null
          seat_leg_height_cm?: number | null
          seat_leg_type?: string | null
          series_id?: string
          spring_exceptions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "series_config_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: true
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      sewing_variants: {
        Row: {
          backrest_id: string | null
          component_code: string
          component_type: string
          created_at: string
          description: string | null
          id: string
          models: string[]
          series_id: string
          variant_name: string
        }
        Insert: {
          backrest_id?: string | null
          component_code: string
          component_type: string
          created_at?: string
          description?: string | null
          id?: string
          models: string[]
          series_id: string
          variant_name: string
        }
        Update: {
          backrest_id?: string | null
          component_code?: string
          component_type?: string
          created_at?: string
          description?: string | null
          id?: string
          models?: string[]
          series_id?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sewing_variants_backrest_id_fkey"
            columns: ["backrest_id"]
            isOneToOne: false
            referencedRelation: "backrests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sewing_variants_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      side_exceptions: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          mapped_code: string
          original_code: string
          series_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          mapped_code: string
          original_code: string
          series_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          mapped_code?: string
          original_code?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_exceptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
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
      sku_parse_rules: {
        Row: {
          code_format: string | null
          component_type: string
          created_at: string
          id: string
          notes: string | null
          series_id: string
          zero_padded: boolean | null
        }
        Insert: {
          code_format?: string | null
          component_type: string
          created_at?: string
          id?: string
          notes?: string | null
          series_id: string
          zero_padded?: boolean | null
        }
        Update: {
          code_format?: string | null
          component_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          series_id?: string
          zero_padded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sku_parse_rules_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_view_cheatsheets: boolean
          can_view_specs: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_view_cheatsheets?: boolean
          can_view_specs?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_view_cheatsheets?: boolean
          can_view_specs?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_images: {
        Row: {
          created_at: string
          image_url: string
          shortcode: string
        }
        Insert: {
          created_at?: string
          image_url: string
          shortcode: string
        }
        Update: {
          created_at?: string
          image_url?: string
          shortcode?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "worker"
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
      app_role: ["admin", "worker"],
    },
  },
} as const
