export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      candidates: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: string;
          note: string | null;
          raw: Json | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          score: number | null;
          source: Database["public"]["Enums"]["candidate_source"];
          source_ref: string | null;
          status: Database["public"]["Enums"]["candidate_status"];
          submitted_by: string | null;
          title: string | null;
          url: string;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          note?: string | null;
          raw?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          score?: number | null;
          source: Database["public"]["Enums"]["candidate_source"];
          source_ref?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          submitted_by?: string | null;
          title?: string | null;
          url: string;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          note?: string | null;
          raw?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          score?: number | null;
          source?: Database["public"]["Enums"]["candidate_source"];
          source_ref?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          submitted_by?: string | null;
          title?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          body: string;
          created_at: string;
          deleted_at: string | null;
          game_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          game_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          game_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_click_visitors: {
        Row: {
          day: string;
          game_id: string;
          visitor: string;
        };
        Insert: {
          day?: string;
          game_id: string;
          visitor: string;
        };
        Update: {
          day?: string;
          game_id?: string;
          visitor?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_click_visitors_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_genres: {
        Row: {
          game_id: string;
          genre_id: number;
        };
        Insert: {
          game_id: string;
          genre_id: number;
        };
        Update: {
          game_id?: string;
          genre_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          click_count: number;
          cover_url: string | null;
          created_at: string;
          developer: string | null;
          featured: boolean;
          gamepad_support: boolean;
          hero_url: string | null;
          id: string;
          last_checked_at: string | null;
          link_status: Database["public"]["Enums"]["link_status"];
          mobile_support: boolean;
          original_title: string;
          platform_id: number | null;
          play_url: string;
          published_at: string | null;
          requires_own_files: boolean;
          search: unknown;
          slug: string;
          source_url: string | null;
          status: Database["public"]["Enums"]["game_status"];
          steamgriddb_id: number | null;
          summary: string | null;
          tech: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          click_count?: number;
          cover_url?: string | null;
          created_at?: string;
          developer?: string | null;
          featured?: boolean;
          gamepad_support?: boolean;
          hero_url?: string | null;
          id?: string;
          last_checked_at?: string | null;
          link_status?: Database["public"]["Enums"]["link_status"];
          mobile_support?: boolean;
          original_title: string;
          platform_id?: number | null;
          play_url: string;
          published_at?: string | null;
          requires_own_files?: boolean;
          search?: unknown;
          slug: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["game_status"];
          steamgriddb_id?: number | null;
          summary?: string | null;
          tech?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          click_count?: number;
          cover_url?: string | null;
          created_at?: string;
          developer?: string | null;
          featured?: boolean;
          gamepad_support?: boolean;
          hero_url?: string | null;
          id?: string;
          last_checked_at?: string | null;
          link_status?: Database["public"]["Enums"]["link_status"];
          mobile_support?: boolean;
          original_title?: string;
          platform_id?: number | null;
          play_url?: string;
          published_at?: string | null;
          requires_own_files?: boolean;
          search?: unknown;
          slug?: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["game_status"];
          steamgriddb_id?: number | null;
          summary?: string | null;
          tech?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      genres: {
        Row: {
          icon: string | null;
          id: number;
          name: string;
          slug: string;
          sort: number;
        };
        Insert: {
          icon?: string | null;
          id?: never;
          name: string;
          slug: string;
          sort?: number;
        };
        Update: {
          icon?: string | null;
          id?: never;
          name?: string;
          slug?: string;
          sort?: number;
        };
        Relationships: [];
      };
      platforms: {
        Row: {
          color: string;
          id: number;
          name: string;
          short_name: string | null;
          slug: string;
          sort: number;
        };
        Insert: {
          color?: string;
          id?: never;
          name: string;
          short_name?: string | null;
          slug: string;
          sort?: number;
        };
        Update: {
          color?: string;
          id?: never;
          name?: string;
          short_name?: string | null;
          slug?: string;
          sort?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          username?: string | null;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          created_at: string;
          game_id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      game_ratings: {
        Row: {
          average: number | null;
          count: number | null;
          game_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      increment_click: {
        Args: { game_slug: string; visitor: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      candidate_source: "reddit" | "hackernews" | "github" | "user";
      candidate_status: "pending" | "approved" | "rejected" | "duplicate";
      game_status: "draft" | "published" | "hidden";
      link_status: "unknown" | "ok" | "broken";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      candidate_source: ["reddit", "hackernews", "github", "user"],
      candidate_status: ["pending", "approved", "rejected", "duplicate"],
      game_status: ["draft", "published", "hidden"],
      link_status: ["unknown", "ok", "broken"],
      user_role: ["user", "admin"],
    },
  },
} as const;
