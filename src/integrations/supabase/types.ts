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
      cheatsheet_sections: {
        Row: {
          active: boolean
          columns: Json
          created_at: string
          data_source: string
          filters: Json
          id: string
          notes: string | null
          product_type_id: string | null
          renderer_config: Json
          renderer_type: string
          section_name: string
          show_specs: boolean
          sort_order: number
          workstation_id: string
        }
        Insert: {
          active?: boolean
          columns: Json
          created_at?: string
          data_source: string
          filters?: Json
          id?: string
          notes?: string | null
          product_type_id?: string | null
          renderer_config?: Json
          renderer_type?: string
          section_name: string
          show_specs?: boolean
          sort_order?: number
          workstation_id: string
        }
        Update: {
          active?: boolean
          columns?: Json
          created_at?: string
          data_source?: string
          filters?: Json
          id?: string
          notes?: string | null
          product_type_id?: string | null
          renderer_config?: Json
          renderer_type?: string
          section_name?: string
          show_specs?: boolean
          sort_order?: number
          workstation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheatsheet_sections_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheatsheet_sections_workstation_id_fkey"
            columns: ["workstation_id"]
            isOneToOne: false
            referencedRelation: "workstations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          product_id: string | null
          title: string
          uploaded_by: string | null
          version: number
          workstation_id: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          product_id?: string | null
          title: string
          uploaded_by?: string | null
          version?: number
          workstation_id?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          product_id?: string | null
          title?: string
          uploaded_by?: string | null
          version?: number
          workstation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workstation_id_fkey"
            columns: ["workstation_id"]
            isOneToOne: false
            referencedRelation: "workstations"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_sections: {
        Row: {
          columns: Json
          condition_field: string | null
          created_at: string
          enabled: boolean
          id: string
          is_conditional: boolean
          product_type: string
          section_name: string
          series_id: string | null
          sort_order: number
        }
        Insert: {
          columns?: Json
          condition_field?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          is_conditional?: boolean
          product_type: string
          section_name: string
          series_id?: string | null
          sort_order?: number
        }
        Update: {
          columns?: Json
          condition_field?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          is_conditional?: boolean
          product_type?: string
          section_name?: string
          series_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_sections_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_settings: {
        Row: {
          font_size_header: number | null
          font_size_table: number | null
          id: string
          table_row_height: number | null
          updated_at: string | null
        }
        Insert: {
          font_size_header?: number | null
          font_size_table?: number | null
          id?: string
          table_row_height?: number | null
          updated_at?: string | null
        }
        Update: {
          font_size_header?: number | null
          font_size_table?: number | null
          id?: string
          table_row_height?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      label_settings: {
        Row: {
          content_max_size: number | null
          content_min_size: number | null
          header_font_size: number | null
          header_template: string | null
          id: string
          left_zone_fields: Json | null
          left_zone_width: number | null
          series_code_size: number | null
          series_collection_size: number | null
          series_name_size: number | null
          updated_at: string | null
        }
        Insert: {
          content_max_size?: number | null
          content_min_size?: number | null
          header_font_size?: number | null
          header_template?: string | null
          id?: string
          left_zone_fields?: Json | null
          left_zone_width?: number | null
          series_code_size?: number | null
          series_collection_size?: number | null
          series_name_size?: number | null
          updated_at?: string | null
        }
        Update: {
          content_max_size?: number | null
          content_min_size?: number | null
          header_font_size?: number | null
          header_template?: string | null
          id?: string
          left_zone_fields?: Json | null
          left_zone_width?: number | null
          series_code_size?: number | null
          series_collection_size?: number | null
          series_name_size?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      label_templates: {
        Row: {
          component: string
          condition_field: string | null
          content_template: string
          created_at: string
          display_fields: Json
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
          display_fields?: Json
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
          display_fields?: Json
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
            referencedRelation: "products"
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
      product_relations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          properties: Json
          relation_type: string
          series_id: string
          source_product_id: string | null
          target_product_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          properties?: Json
          relation_type: string
          series_id: string
          source_product_id?: string | null
          target_product_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          properties?: Json
          relation_type?: string
          series_id?: string
          source_product_id?: string | null
          target_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_relations_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string
          height: number | null
          id: string
          length: number | null
          material: string | null
          name: string | null
          notes: string | null
          position_number: number
          product_id: string
          quantity: number
          spec_type: string
          updated_at: string
          variant_ref: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          material?: string | null
          name?: string | null
          notes?: string | null
          position_number?: number
          product_id: string
          quantity?: number
          spec_type: string
          updated_at?: string
          variant_ref?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          material?: string | null
          name?: string | null
          notes?: string | null
          position_number?: number
          product_id?: string
          quantity?: number
          spec_type?: string
          updated_at?: string
          variant_ref?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_specs_variant_ref_fkey"
            columns: ["variant_ref"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_standalone: boolean
          name: string
          sku_prefix: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_standalone?: boolean
          name: string
          sku_prefix?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_standalone?: boolean
          name?: string
          sku_prefix?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          allowed_finishes: string[] | null
          category: string
          code: string
          colors: Json
          created_at: string
          default_finish: string | null
          id: string
          is_global: boolean
          name: string
          product_type_id: string | null
          properties: Json
          series_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_finishes?: string[] | null
          category: string
          code: string
          colors?: Json
          created_at?: string
          default_finish?: string | null
          id?: string
          is_global?: boolean
          name: string
          product_type_id?: string | null
          properties?: Json
          series_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_finishes?: string[] | null
          category?: string
          code?: string
          colors?: Json
          created_at?: string
          default_finish?: string | null
          id?: string
          is_global?: boolean
          name?: string
          product_type_id?: string | null
          properties?: Json
          series_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      sku_segments: {
        Row: {
          capture_groups: Json
          category: string
          created_at: string
          has_finish_suffix: boolean
          id: string
          is_optional: boolean
          notes: string | null
          position: number
          prefix: string | null
          product_type_id: string
          regex_pattern: string
          segment_name: string
          zero_padded: boolean
        }
        Insert: {
          capture_groups: Json
          category: string
          created_at?: string
          has_finish_suffix?: boolean
          id?: string
          is_optional?: boolean
          notes?: string | null
          position: number
          prefix?: string | null
          product_type_id: string
          regex_pattern: string
          segment_name: string
          zero_padded?: boolean
        }
        Update: {
          capture_groups?: Json
          category?: string
          created_at?: string
          has_finish_suffix?: boolean
          id?: string
          is_optional?: boolean
          notes?: string | null
          position?: number
          prefix?: string | null
          product_type_id?: string
          regex_pattern?: string
          segment_name?: string
          zero_padded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sku_segments_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
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
      workstations: {
        Row: {
          active: boolean
          code: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
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
      is_admin: { Args: never; Returns: boolean }
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
