export type MatchStage = "group" | "qf" | "sf" | "final" | "third";
export type MatchStatus =
  | "not_started"
  | "live_first_half"
  | "half_time"
  | "live_second_half"
  | "full_time";

export type MatchEventType =
  | "match_started"
  | "goal"
  | "own_goal"
  | "half_time"
  | "yellow_card"
  | "red_card"
  | "full_time";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          is_admin?: boolean;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          group_letter: string;
          group_order: number;
          manager_1: string | null;
          manager_2: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          group_letter: string;
          group_order: number;
          manager_1?: string | null;
          manager_2?: string | null;
        };
        Update: {
          name?: string;
          group_letter?: string;
          group_order?: number;
          manager_1?: string | null;
          manager_2?: string | null;
        };
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          sort_order: number;
          is_goalkeeper: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          sort_order?: number;
          is_goalkeeper?: boolean;
        };
        Update: {
          team_id?: string;
          name?: string;
          sort_order?: number;
          is_goalkeeper?: boolean;
        };
      };
      matches: {
        Row: {
          id: string;
          stage: MatchStage;
          slot_code: string | null;
          group_letter: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          home_score: number;
          away_score: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stage: MatchStage;
          slot_code?: string | null;
          group_letter?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          scheduled_at?: string | null;
          status?: MatchStatus;
          home_score?: number;
          away_score?: number;
          sort_order?: number;
        };
        Update: {
          stage?: MatchStage;
          slot_code?: string | null;
          group_letter?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          scheduled_at?: string | null;
          status?: MatchStatus;
          home_score?: number;
          away_score?: number;
          sort_order?: number;
        };
      };
      match_goals: {
        Row: {
          id: string;
          match_id: string;
          team_id: string;
          scorer_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team_id: string;
          scorer_name: string;
        };
        Update: {
          match_id?: string;
          team_id?: string;
          scorer_name?: string;
        };
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          event_type: MatchEventType;
          team_id: string | null;
          player_name: string | null;
          event_order: number;
          event_minute: number | null;
          event_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          event_type: MatchEventType;
          team_id?: string | null;
          player_name?: string | null;
          event_order?: number;
          event_minute?: number | null;
          event_note?: string | null;
        };
        Update: {
          match_id?: string;
          event_type?: MatchEventType;
          team_id?: string | null;
          player_name?: string | null;
          event_order?: number;
          event_minute?: number | null;
          event_note?: string | null;
        };
      };
      site_settings: {
        Row: {
          key: string;
          value: unknown;
        };
        Insert: {
          key: string;
          value?: unknown;
        };
        Update: {
          value?: unknown;
        };
      };
    };
  };
};
