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
      app_settings: {
        Row: {
          created_at: string
          data_path: string
          id: number
          images_path: string
          language: string
          lyrics_path: string
          updated_at: string
          use24hour: boolean
          videos_path: string
        }
        Insert: {
          created_at?: string
          data_path?: string
          id?: number
          images_path?: string
          language?: string
          lyrics_path?: string
          updated_at?: string
          use24hour?: boolean
          videos_path?: string
        }
        Update: {
          created_at?: string
          data_path?: string
          id?: number
          images_path?: string
          language?: string
          lyrics_path?: string
          updated_at?: string
          use24hour?: boolean
          videos_path?: string
        }
        Relationships: []
      }
      custom_slides: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          content: string
          created_at: string
          id: string
          settings: Json | null
          slide_type: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          content: string
          created_at?: string
          id?: string
          settings?: Json | null
          slide_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          content?: string
          created_at?: string
          id?: string
          settings?: Json | null
          slide_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: []
      }
      presentation_history: {
        Row: {
          duration_seconds: number | null
          id: string
          notes: string | null
          presentation_id: string | null
          presented_at: string
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          presentation_id?: string | null
          presented_at?: string
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          presentation_id?: string | null
          presented_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_history_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_items: {
        Row: {
          created_at: string
          custom_slide_id: string | null
          id: string
          item_type: string
          order_index: number
          presentation_id: string
          settings: Json | null
          song_id: string | null
          theme_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          custom_slide_id?: string | null
          id?: string
          item_type: string
          order_index: number
          presentation_id: string
          settings?: Json | null
          song_id?: string | null
          theme_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          custom_slide_id?: string | null
          id?: string
          item_type?: string
          order_index?: number
          presentation_id?: string
          settings?: Json | null
          song_id?: string | null
          theme_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_items_custom_slide_id_fkey"
            columns: ["custom_slide_id"]
            isOneToOne: false
            referencedRelation: "custom_slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_items_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_items_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_backgrounds"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          created_at: string
          current_slide_id: string | null
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_slide_id?: string | null
          description?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_slide_id?: string | null
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      song_tags: {
        Row: {
          song_id: string
          tag_id: string
        }
        Insert: {
          song_id: string
          tag_id: string
        }
        Update: {
          song_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tags_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          ai_analysis: Json | null
          album: string | null
          artist: string
          cache_version: string | null
          created_at: string
          genre: string | null
          id: string
          is_local: boolean | null
          language: string | null
          lyrics: string
          metadata: Json | null
          provider: string | null
          search_terms: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          album?: string | null
          artist: string
          cache_version?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_local?: boolean | null
          language?: string | null
          lyrics: string
          metadata?: Json | null
          provider?: string | null
          search_terms?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          album?: string | null
          artist?: string
          cache_version?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_local?: boolean | null
          language?: string | null
          lyrics?: string
          metadata?: Json | null
          provider?: string | null
          search_terms?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          animation_type: string | null
          background_position: string | null
          body_font_family: string | null
          created_at: string
          font_size: number | null
          font_weight: number | null
          id: string
          is_default: boolean | null
          name: string
          text_color: string | null
          text_outline: string | null
          text_shadow: string | null
          title_font_family: string | null
        }
        Insert: {
          animation_type?: string | null
          background_position?: string | null
          body_font_family?: string | null
          created_at?: string
          font_size?: number | null
          font_weight?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          text_color?: string | null
          text_outline?: string | null
          text_shadow?: string | null
          title_font_family?: string | null
        }
        Update: {
          animation_type?: string | null
          background_position?: string | null
          body_font_family?: string | null
          created_at?: string
          font_size?: number | null
          font_weight?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          text_color?: string | null
          text_outline?: string | null
          text_shadow?: string | null
          title_font_family?: string | null
        }
        Relationships: []
      }
      video_backgrounds: {
        Row: {
          created_at: string
          id: string
          name: string
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
          url?: string
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
