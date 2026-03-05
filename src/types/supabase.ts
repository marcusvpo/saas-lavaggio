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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      expense_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          due_date: string
          id: string
          interest_amount: number
          observations: string | null
          status: string
          store_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          due_date: string
          id?: string
          interest_amount?: number
          observations?: string | null
          status: string
          store_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          due_date?: string
          id?: string
          interest_amount?: number
          observations?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          id: string
          month: number | null
          store_id: string | null
          type: string
          updated_at: string | null
          value: number
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month?: number | null
          store_id?: string | null
          type: string
          updated_at?: string | null
          value?: number
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number | null
          store_id?: string | null
          type?: string
          updated_at?: string | null
          value?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          current_quantity: number
          id: string
          min_stock_alert: number | null
          name: string
          store_id: string
          unit: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          current_quantity?: number
          id?: string
          min_stock_alert?: number | null
          name: string
          store_id: string
          unit?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          current_quantity?: number
          id?: string
          min_stock_alert?: number | null
          name?: string
          store_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          movement_type: string
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          movement_type: string
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_delay_rules: {
        Row: {
          created_at: string | null
          delay_days: number | null
          description: string | null
          id: string
          payment_method_id: string
        }
        Insert: {
          created_at?: string | null
          delay_days?: number | null
          description?: string | null
          id?: string
          payment_method_id: string
        }
        Update: {
          created_at?: string | null
          delay_days?: number | null
          description?: string | null
          id?: string
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_delay_rules_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: true
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          fee_percentage: number
          id: string
          installments: number
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          fee_percentage?: number
          id?: string
          installments?: number
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          fee_percentage?: number
          id?: string
          installments?: number
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      revenue_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          created_at: string
          date: string
          expected_receipt_date: string | null
          id: string
          nao_pago_acumulado: number
          net_amount: number | null
          observations: string | null
          paid_amount: number
          payment_method_id: string | null
          pieces_count: number
          revenue_category_id: string | null
          store_id: string
          total_amount: number
          unpaid_amount: number
        }
        Insert: {
          created_at?: string
          date: string
          expected_receipt_date?: string | null
          id?: string
          nao_pago_acumulado?: number
          net_amount?: number | null
          observations?: string | null
          paid_amount?: number
          payment_method_id?: string | null
          pieces_count?: number
          revenue_category_id?: string | null
          store_id: string
          total_amount?: number
          unpaid_amount?: number
        }
        Update: {
          created_at?: string
          date?: string
          expected_receipt_date?: string | null
          id?: string
          nao_pago_acumulado?: number
          net_amount?: number | null
          observations?: string | null
          paid_amount?: number
          payment_method_id?: string | null
          pieces_count?: number
          revenue_category_id?: string | null
          store_id?: string
          total_amount?: number
          unpaid_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenues_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_revenue_category_id_fkey"
            columns: ["revenue_category_id"]
            isOneToOne: false
            referencedRelation: "revenue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          destination_store_id: string
          id: string
          source_store_id: string
          transfer_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination_store_id: string
          id?: string
          source_store_id: string
          transfer_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination_store_id?: string
          id?: string
          source_store_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_destination_store_id_fkey"
            columns: ["destination_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_source_store_id_fkey"
            columns: ["source_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          store_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          role: string
          store_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
