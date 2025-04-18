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
      products: {
        Row: {
          id: string
          name: string
          price: number
          category: string
          stock: number
          image: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          category: string
          stock?: number
          image?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          category?: string
          stock?: number
          image?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          total: number
          payment_method: string
          cash_received: number | null
          change_amount: number | null
          status: 'completed' | 'cancelled'
          cashier_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          total: number
          payment_method: string
          cash_received?: number | null
          change_amount?: number | null
          status: 'completed' | 'cancelled'
          cashier_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          total?: number
          payment_method?: string
          cash_received?: number | null
          change_amount?: number | null
          status?: 'completed' | 'cancelled'
          cashier_id?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string
          quantity: number
          price_at_time: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id: string
          quantity: number
          price_at_time: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          product_id?: string
          quantity?: number
          price_at_time?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}