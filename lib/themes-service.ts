import { supabase } from './supabase';
import type { definitions } from './database.types';

// The 'themes' table structure from the generated types
export type Theme = definitions['themes']['Row'];
export type ThemeInsert = definitions['themes']['Insert'];
export type ThemeUpdate = definitions['themes']['Update'];

export const getThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase.from('themes').select('*');
  if (error) {
    console.error('Error fetching themes:', error);
    throw error;
  }
  return data;
};

export const createTheme = async (themeData: ThemeInsert): Promise<Theme> => {
  const { data, error } = await supabase.from('themes').insert(themeData).select().single();
  if (error || !data) {
    console.error('Error creating theme:', error);
    throw error || new Error('No data returned after insert');
  }
  return data;
};

export const updateTheme = async (id: string, themeData: ThemeUpdate): Promise<Theme> => {
  const { data, error } = await supabase.from('themes').update(themeData).eq('id', id).select().single();
  if (error || !data) {
    console.error('Error updating theme:', error);
    throw error || new Error('No data returned after update');
  }
  return data;
};

export const deleteTheme = async (id: string) => {
  const { error } = await supabase.from('themes').delete().eq('id', id);
  if (error) {
    console.error('Error deleting theme:', error);
    throw error;
  }
  return { success: true };
};
