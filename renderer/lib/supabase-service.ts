import { supabase } from './supabase';
import type { Song, VideoBackground, Theme } from './supabase';

// ========== SONGS ==========

export async function getAllSongs() {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }

  return data;
}

export async function getSongById(id: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching song:', error);
    return null;
  }

  return data;
}

export async function createSong(song: Omit<Song, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('songs')
    .insert([song])
    .select()
    .single();

  if (error) {
    console.error('Error creating song:', error);
    throw error;
  }

  return data;
}

export async function updateSong(id: string, updates: Partial<Song>) {
  const { data, error } = await supabase
    .from('songs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating song:', error);
    throw error;
  }

  return data;
}

export async function deleteSong(id: string) {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting song:', error);
    throw error;
  }

  return true;
}

export async function searchSongs(query: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching songs:', error);
    return [];
  }

  return data;
}

// ========== VIDEO BACKGROUNDS ==========

export async function getAllVideoBackgrounds() {
  const { data, error } = await supabase
    .from('video_backgrounds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching video backgrounds:', error);
    return [];
  }

  return data;
}

export async function createVideoBackground(video: Omit<VideoBackground, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('video_backgrounds')
    .insert([video])
    .select()
    .single();

  if (error) {
    console.error('Error creating video background:', error);
    throw error;
  }

  return data;
}

export async function deleteVideoBackground(id: string) {
  const { error } = await supabase
    .from('video_backgrounds')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting video background:', error);
    throw error;
  }

  return true;
}

// ========== THEMES ==========

export async function getAllThemes() {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching themes:', error);
    return [];
  }

  return data;
}

export async function getDefaultTheme() {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error) {
    console.error('Error fetching default theme:', error);
    return null;
  }

  return data;
}

export async function createTheme(theme: Omit<Theme, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('themes')
    .insert([theme])
    .select()
    .single();

  if (error) {
    console.error('Error creating theme:', error);
    throw error;
  }

  return data;
}

export async function updateTheme(id: string, updates: Partial<Theme>) {
  const { data, error } = await supabase
    .from('themes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating theme:', error);
    throw error;
  }

  return data;
}

export async function deleteTheme(id: string) {
  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting theme:', error);
    throw error;
  }

  return true;
}
