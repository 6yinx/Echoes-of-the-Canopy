import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '__PLACEHOLDER__';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '__PLACEHOLDER__';

export const supabase = supabaseUrl !== '__PLACEHOLDER__' && supabaseAnonKey !== '__PLACEHOLDER__'
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type PlayerSave = {
    id?: string;
    user_id?: string;
    session_id: string;
    save_name: string;
    health: number;
    hunger: number;
    stamina: number;
    player_position: [number, number, number];
    time_of_day: number;
    is_lantern_active: boolean;
    inventory: any[];
    active_slot: number;
    dropped_items: any[];
    show_touch_controls: boolean;
    created_at?: string;
    updated_at?: string;
    is_auto_save: boolean;
};
