import { supabase, PlayerSave } from './supabaseClient';

// Generate or retrieve session ID for anonymous saves
export const getSessionId = (): string => {
    let sessionId = localStorage.getItem('echoes_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('echoes_session_id', sessionId);
    }
    return sessionId;
};

// Save game data to Supabase database
export const saveToDatabase = async (
    saveData: Omit<PlayerSave, 'id' | 'created_at' | 'updated_at'>
): Promise<boolean> => {
    if (!supabase) {
        console.warn('Supabase not configured, using localStorage only');
        return false;
    }

    try {
        const { error } = await supabase
            .from('player_saves')
            .upsert(
                {
                    ...saveData,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'session_id,save_name'
                }
            );

        if (error) throw error;
        console.log('✅ Saved to cloud database');
        return true;
    } catch (error) {
        console.error('Failed to save to database:', error);
        return false;
    }
};

// Load game data from Supabase database
export const loadFromDatabase = async (sessionId: string): Promise<PlayerSave | null> => {
    if (!supabase) {
        console.warn('Supabase not configured, using localStorage only');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('player_saves')
            .select('*')
            .eq('session_id', sessionId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            console.log('✅ Loaded from cloud database');
        }
        return data;
    } catch (error) {
        console.error('Failed to load from database:', error);
        return null;
    }
};

// Check if a save exists in the database
export const hasSaveInDatabase = async (sessionId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { data, error } = await supabase
            .from('player_saves')
            .select('id')
            .eq('session_id', sessionId)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Failed to check for save:', error);
        return false;
    }
};
