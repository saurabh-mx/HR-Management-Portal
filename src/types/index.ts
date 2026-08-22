import type { Session } from '@supabase/supabase-js';

export interface Employee {
  id?: string;
  name: string;
  role: string;
  is_admin: boolean;
  department?: string;
  rank?: string;
  badge_number?: string;
  discord_tag?: string;
}

export type { Session };
