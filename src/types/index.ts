import type { Session } from '@supabase/supabase-js';

export interface Employee {
  name: string;
  role: string;
  is_admin: boolean;
}

export type { Session };
