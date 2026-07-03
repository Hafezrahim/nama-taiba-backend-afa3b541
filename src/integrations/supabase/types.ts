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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      about_info: {
        Row: {
          content_ar: string
          content_en: string
          created_at: string | null
          id: string
          image: string | null
          section_key: string
          updated_at: string | null
        }
        Insert: {
          content_ar: string
          content_en: string
          created_at?: string | null
          id?: string
          image?: string | null
          section_key: string
          updated_at?: string | null
        }
        Update: {
          content_ar?: string
          content_en?: string
          created_at?: string | null
          id?: string
          image?: string | null
          section_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      backup_settings: {
        Row: {
          frequency: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          next_run_at: string | null
          updated_at: string
        }
        Insert: {
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
        }
        Update: {
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          record_counts: Json
          status: string
          tables: string[]
          total_records: number
          trigger_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          record_counts?: Json
          status?: string
          tables?: string[]
          total_records?: number
          trigger_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          record_counts?: Json
          status?: string
          tables?: string[]
          total_records?: number
          trigger_type?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author: string | null
          content_ar: string | null
          content_en: string | null
          created_at: string | null
          featured_image: string | null
          id: string
          image: string | null
          is_published: boolean | null
          keywords: string | null
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_title_ar: string | null
          meta_title_en: string | null
          published_date: string | null
          read_time: number | null
          slug: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          featured_image?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          keywords?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          published_date?: string | null
          read_time?: number | null
          slug?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          featured_image?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          keywords?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          published_date?: string | null
          read_time?: number | null
          slug?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          id: string
          image: string | null
          is_active: boolean | null
          name_ar: string
          name_en: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image: string | null
          issued_by_ar: string | null
          issued_by_en: string | null
          issued_date: string | null
          name_ar: string
          name_en: string
          type_ar: string | null
          type_en: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image?: string | null
          issued_by_ar?: string | null
          issued_by_en?: string | null
          issued_date?: string | null
          name_ar: string
          name_en: string
          type_ar?: string | null
          type_en?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image?: string | null
          issued_by_ar?: string | null
          issued_by_en?: string | null
          issued_date?: string | null
          name_ar?: string
          name_en?: string
          type_ar?: string | null
          type_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbot_faqs: {
        Row: {
          answer_ar: string
          answer_en: string
          category_ar: string | null
          category_en: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question_ar: string
          question_en: string
          updated_at: string | null
        }
        Insert: {
          answer_ar: string
          answer_en: string
          category_ar?: string | null
          category_en?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question_ar: string
          question_en: string
          updated_at?: string | null
        }
        Update: {
          answer_ar?: string
          answer_en?: string
          category_ar?: string | null
          category_en?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question_ar?: string
          question_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address_ar: string
          address_en: string
          created_at: string | null
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          map_center_lat: number | null
          map_center_lng: number | null
          map_url: string | null
          map_zoom: number | null
          phone: string
          updated_at: string | null
          vat_number: string | null
          vat_rate: number | null
          whatsapp: string | null
        }
        Insert: {
          address_ar: string
          address_en: string
          created_at?: string | null
          email: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          map_center_lat?: number | null
          map_center_lng?: number | null
          map_url?: string | null
          map_zoom?: number | null
          phone: string
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          whatsapp?: string | null
        }
        Update: {
          address_ar?: string
          address_en?: string
          created_at?: string | null
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          map_center_lat?: number | null
          map_center_lng?: number | null
          map_url?: string | null
          map_zoom?: number | null
          phone?: string
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      deliverers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          notes: string | null
          phone: string
          updated_at: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          notes?: string | null
          phone: string
          updated_at?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          notes?: string | null
          phone?: string
          updated_at?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          city_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          shipping_price: number
          updated_at: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          shipping_price?: number
          updated_at?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          shipping_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      map_locations: {
        Row: {
          address_ar: string | null
          address_en: string | null
          created_at: string
          display_order: number
          email: string | null
          icon_color: string | null
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          map_url: string | null
          name_ar: string
          name_en: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          icon_color?: string | null
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          map_url?: string | null
          name_ar: string
          name_en: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          icon_color?: string | null
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          map_url?: string | null
          name_ar?: string
          name_en?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      marketer_applications: {
        Row: {
          city: string
          created_at: string | null
          cv_file_data: string | null
          cv_file_name: string | null
          cv_file_type: string | null
          id: string
          is_processed: boolean | null
          message: string | null
          name: string
          phone: string
          total_experience: string
        }
        Insert: {
          city: string
          created_at?: string | null
          cv_file_data?: string | null
          cv_file_name?: string | null
          cv_file_type?: string | null
          id?: string
          is_processed?: boolean | null
          message?: string | null
          name: string
          phone: string
          total_experience: string
        }
        Update: {
          city?: string
          created_at?: string | null
          cv_file_data?: string | null
          cv_file_name?: string | null
          cv_file_type?: string | null
          id?: string
          is_processed?: boolean | null
          message?: string | null
          name?: string
          phone?: string
          total_experience?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_ar: string
          message_en: string
          metadata: Json | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_ar: string
          message_en: string
          metadata?: Json | null
          title_ar: string
          title_en: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_ar?: string
          message_en?: string
          metadata?: Json | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          category: string
          contact: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          image: string | null
          is_active: boolean | null
          max_qty: number | null
          min_qty: number | null
          price: number
          title_ar: string
          title_en: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          category: string
          contact?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          max_qty?: number | null
          min_qty?: number | null
          price?: number
          title_ar: string
          title_en: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string
          contact?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          max_qty?: number | null
          min_qty?: number | null
          price?: number
          title_ar?: string
          title_en?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name_ar: string
          product_name_en: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name_ar: string
          product_name_en: string
          quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name_ar?: string
          product_name_en?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_address: string
          customer_name: string
          customer_phone: string
          discount: number
          id: string
          notes: string | null
          reference_source: string | null
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_address: string
          customer_name: string
          customer_phone: string
          discount?: number
          id?: string
          notes?: string | null
          reference_source?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          notes?: string | null
          reference_source?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          image: string | null
          in_stock: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          keywords: string | null
          moq: number
          name_ar: string
          name_en: string
          price: number
          size: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string | null
          moq?: number
          name_ar: string
          name_en: string
          price?: number
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string | null
          moq?: number
          name_ar?: string
          name_en?: string
          price?: number
          size?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio_ar: string | null
          bio_en: string | null
          created_at: string | null
          full_name_ar: string | null
          full_name_en: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string | null
          full_name_ar?: string | null
          full_name_en?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string | null
          full_name_ar?: string | null
          full_name_en?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          date: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_featured: boolean | null
          keywords: string | null
          location: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string | null
          location?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string | null
          location?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          admin_reply: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          is_processed: boolean | null
          message: string | null
          name: string
          offer_id: string | null
          phone: string | null
          product_id: string | null
          quantity: number | null
        }
        Insert: {
          admin_reply?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_processed?: boolean | null
          message?: string | null
          name: string
          offer_id?: string | null
          phone?: string | null
          product_id?: string | null
          quantity?: number | null
        }
        Update: {
          admin_reply?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_processed?: boolean | null
          message?: string | null
          name?: string
          offer_id?: string | null
          phone?: string | null
          product_id?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_findings: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          notes: string | null
          recommendation: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          recommendation?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          recommendation?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_snapshots: {
        Row: {
          checks: Json | null
          created_at: string
          gsc_summary: Json | null
          id: string
          notes: string | null
          on_page_score: number | null
          robots_ok: boolean | null
          sitemap_lastmod: string | null
          sitemap_urls: number | null
          snapshot_date: string
          source: string
          structured_data_valid: boolean | null
          verification_status: Json | null
        }
        Insert: {
          checks?: Json | null
          created_at?: string
          gsc_summary?: Json | null
          id?: string
          notes?: string | null
          on_page_score?: number | null
          robots_ok?: boolean | null
          sitemap_lastmod?: string | null
          sitemap_urls?: number | null
          snapshot_date?: string
          source?: string
          structured_data_valid?: boolean | null
          verification_status?: Json | null
        }
        Update: {
          checks?: Json | null
          created_at?: string
          gsc_summary?: Json | null
          id?: string
          notes?: string | null
          on_page_score?: number | null
          robots_ok?: boolean | null
          sitemap_lastmod?: string | null
          sitemap_urls?: number | null
          snapshot_date?: string
          source?: string
          structured_data_valid?: boolean | null
          verification_status?: Json | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          delivered_at: string | null
          deliverer_id: string
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          deliverer_id: string
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          deliverer_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "deliverers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      slider: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          id: string
          image: string
          is_active: boolean | null
          link: string | null
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image: string
          is_active?: boolean | null
          link?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          image?: string
          is_active?: boolean | null
          link?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string
          name_en: string
          position_ar: string
          position_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar: string
          name_en: string
          position_ar: string
          position_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          position_ar?: string
          position_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar: string | null
          content_ar: string
          content_en: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          name_ar: string
          name_en: string
          position_ar: string | null
          position_en: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          content_ar: string
          content_en: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name_ar: string
          name_en: string
          position_ar?: string | null
          position_en?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          content_ar?: string
          content_en?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name_ar?: string
          name_en?: string
          position_ar?: string | null
          position_en?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_permissions: {
        Row: {
          created_at: string | null
          id: string
          page_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      increment_blog_views: { Args: { blog_id: string }; Returns: undefined }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "client" | "marketer"
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
      app_role: ["admin", "user", "client", "marketer"],
    },
  },
} as const
