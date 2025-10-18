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
      command_history: {
        Row: {
          command_id: string
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          success: boolean | null
        }
        Insert: {
          command_id: string
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          success?: boolean | null
        }
        Update: {
          command_id?: string
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          success?: boolean | null
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
      import_export_log: {
        Row: {
          duration_ms: number | null
          entity_count: number
          entity_type: string
          errors: Json | null
          executed_at: string | null
          failed_count: number
          file_path: string | null
          format: string
          id: string
          operation_type: string
          success_count: number
        }
        Insert: {
          duration_ms?: number | null
          entity_count: number
          entity_type: string
          errors?: Json | null
          executed_at?: string | null
          failed_count: number
          file_path?: string | null
          format: string
          id?: string
          operation_type: string
          success_count: number
        }
        Update: {
          duration_ms?: number | null
          entity_count?: number
          entity_type?: string
          errors?: Json | null
          executed_at?: string | null
          failed_count?: number
          file_path?: string | null
          format?: string
          id?: string
          operation_type?: string
          success_count?: number
        }
        Relationships: []
      }
      keyboard_shortcuts: {
        Row: {
          created_at: string | null
          device_id: string
          enabled: boolean | null
          id: string
          key_combination: string
          shortcut_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          enabled?: boolean | null
          id?: string
          key_combination: string
          shortcut_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          enabled?: boolean | null
          id?: string
          key_combination?: string
          shortcut_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          added_at: string | null
          order_index: number
          playlist_id: string
          song_id: string
        }
        Insert: {
          added_at?: string | null
          order_index: number
          playlist_id: string
          song_id: string
        }
        Update: {
          added_at?: string | null
          order_index?: number
          playlist_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tags: {
        Row: {
          playlist_id: string
          tag_id: string
        }
        Insert: {
          playlist_id: string
          tag_id: string
        }
        Update: {
          playlist_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tags_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_smart: boolean | null
          name: string
          smart_filters: Json | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_smart?: boolean | null
          name: string
          smart_filters?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_smart?: boolean | null
          name?: string
          smart_filters?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
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
            referencedRelation: "song_stats"
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
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          id: string
          query: string
          result_count: number | null
          searched_at: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          id?: string
          query: string
          result_count?: number | null
          searched_at?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          id?: string
          query?: string
          result_count?: number | null
          searched_at?: string | null
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
            referencedRelation: "song_stats"
            referencedColumns: ["id"]
          },
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
      song_usage: {
        Row: {
          duration_seconds: number | null
          id: string
          presentation_id: string | null
          song_id: string | null
          used_at: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          presentation_id?: string | null
          song_id?: string | null
          used_at?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          presentation_id?: string | null
          song_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_usage_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_usage_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_usage_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
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
          lyrics_length: number | null
          lyrics_preview: string | null
          metadata: Json | null
          provider: string | null
          search_terms: string | null
          search_vector: unknown | null
          storage_path: string | null
          title: string
          updated_at: string
          url: string | null
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
          lyrics_length?: number | null
          lyrics_preview?: string | null
          metadata?: Json | null
          provider?: string | null
          search_terms?: string | null
          search_vector?: unknown | null
          storage_path?: string | null
          title: string
          updated_at?: string
          url?: string | null
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
          lyrics_length?: number | null
          lyrics_preview?: string | null
          metadata?: Json | null
          provider?: string | null
          search_terms?: string | null
          search_vector?: unknown | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      sync_metadata: {
        Row: {
          checksum: string | null
          conflict_detected: boolean | null
          device_id: string
          entity_id: string
          entity_type: string
          id: string
          last_synced_at: string | null
          synced_to_cloud: boolean | null
          version: number
        }
        Insert: {
          checksum?: string | null
          conflict_detected?: boolean | null
          device_id: string
          entity_id: string
          entity_type: string
          id?: string
          last_synced_at?: string | null
          synced_to_cloud?: boolean | null
          version?: number
        }
        Update: {
          checksum?: string | null
          conflict_detected?: boolean | null
          device_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_synced_at?: string | null
          synced_to_cloud?: boolean | null
          version?: number
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
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          properties: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          properties: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          properties?: Json
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          device_id: string
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          device_id: string
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          device_id?: string
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
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
      command_usage_stats: {
        Row: {
          avg_execution_time: number | null
          command_id: string | null
          last_used: string | null
          success_rate: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      popular_searches: {
        Row: {
          avg_results: number | null
          last_searched: string | null
          query: string | null
          search_count: number | null
        }
        Relationships: []
      }
      presentation_stats: {
        Row: {
          avg_duration: number | null
          date: string | null
          presentations_count: number | null
          total_duration: number | null
          unique_presentations: number | null
        }
        Relationships: []
      }
      song_stats: {
        Row: {
          artist: string | null
          avg_presentation_time: number | null
          id: string | null
          last_used: string | null
          title: string | null
          total_presentation_time: number | null
          usage_count: number | null
        }
        Relationships: []
      }
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
