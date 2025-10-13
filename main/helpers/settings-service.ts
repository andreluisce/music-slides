import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created for settings');
}

const SETTINGS_TABLE = 'app_settings';

export interface AppSettings {
  language: string;
  use24Hour: boolean;
  dataPath: string;
  lyricsPath: string;
  imagesPath: string;
  videosPath: string;
}

const defaultSettings: AppSettings = {
  language: 'pt-BR',
  use24Hour: false,
  dataPath: 'Documents/LyricsShow',
  lyricsPath: 'Documents/LyricsShow/songs',
  imagesPath: 'Documents/LyricsShow/images',
  videosPath: 'Documents/LyricsShow/videos',
};

/**
 * Get all settings from Supabase
 */
export async function getSettings(): Promise<AppSettings> {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, using default settings');
    return defaultSettings;
  }

  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default
        console.log('📝 Creating default settings in Supabase');
        return await createSettings(defaultSettings);
      }
      throw error;
    }

    return {
      language: data.language || defaultSettings.language,
      use24Hour: data.use24hour || defaultSettings.use24Hour,
      dataPath: data.data_path || defaultSettings.dataPath,
      lyricsPath: data.lyrics_path || defaultSettings.lyricsPath,
      imagesPath: data.images_path || defaultSettings.imagesPath,
      videosPath: data.videos_path || defaultSettings.videosPath,
    };
  } catch (error) {
    console.error('❌ Error getting settings from Supabase:', error);
    return defaultSettings;
  }
}

/**
 * Create settings in Supabase
 */
async function createSettings(settings: AppSettings): Promise<AppSettings> {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, cannot create settings');
    return settings;
  }

  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .insert({
        language: settings.language,
        use24hour: settings.use24Hour,
        data_path: settings.dataPath,
        lyrics_path: settings.lyricsPath,
        images_path: settings.imagesPath,
        videos_path: settings.videosPath,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Settings created in Supabase');
    return settings;
  } catch (error) {
    console.error('❌ Error creating settings in Supabase:', error);
    return settings;
  }
}

/**
 * Update a specific setting in Supabase
 */
export async function updateSetting(key: keyof AppSettings, value: any): Promise<void> {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, cannot update setting');
    return;
  }

  try {
    // Map camelCase to snake_case for database
    const dbKey = key === 'use24Hour' ? 'use24hour' :
                  key === 'dataPath' ? 'data_path' :
                  key === 'lyricsPath' ? 'lyrics_path' :
                  key === 'imagesPath' ? 'images_path' :
                  key === 'videosPath' ? 'videos_path' : key;

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .update({
        [dbKey]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1); // Assuming single row with id = 1

    if (error) throw error;

    console.log(`✅ Setting '${key}' updated in Supabase`);
  } catch (error) {
    console.error(`❌ Error updating setting '${key}' in Supabase:`, error);
    throw error;
  }
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, cannot update settings');
    return;
  }

  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (settings.language !== undefined) updateData.language = settings.language;
    if (settings.use24Hour !== undefined) updateData.use24hour = settings.use24Hour;
    if (settings.dataPath !== undefined) updateData.data_path = settings.dataPath;
    if (settings.lyricsPath !== undefined) updateData.lyrics_path = settings.lyricsPath;
    if (settings.imagesPath !== undefined) updateData.images_path = settings.imagesPath;
    if (settings.videosPath !== undefined) updateData.videos_path = settings.videosPath;

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .update(updateData)
      .eq('id', 1);

    if (error) throw error;

    console.log('✅ Settings updated in Supabase');
  } catch (error) {
    console.error('❌ Error updating settings in Supabase:', error);
    throw error;
  }
}
