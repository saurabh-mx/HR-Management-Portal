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
  claim_status?: string;
  status?: string;
  citizen_id?: string;
  phone_number?: string;
  department_join_date?: string;
  duration_in_department?: string;
  last_promotion_date?: string;
  days_since_last_promoted?: number;
  sub_department?: string;
  led_sub_departments?: string[];
  titles?: string;
  notes?: string;
  cert_fto?: boolean;
  cert_asd?: boolean;
  cert_heat?: boolean;
  cert_swat?: boolean;
  cert_cid?: boolean;
  cert_meu?: boolean;
  cert_k9?: boolean;
  cert_sop?: boolean;
  callsign?: string;
  avatar_url?: string;
}

export type { Session };
