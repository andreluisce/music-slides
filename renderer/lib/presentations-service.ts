import { supabase } from './supabase';
import type { Presentation, PresentationItem, CustomSlide, Tag, Favorite } from './supabase';

// ========== PRESENTATIONS ==========

export async function getAllPresentations() {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching presentations:', error);
    return [];
  }

  return data as Presentation[];
}

export async function getPresentationById(id: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      presentation_items (
        *,
        song:songs(*),
        custom_slide:custom_slides(*),
        theme:themes(*),
        video:video_backgrounds(*)
      )
    `)
    .eq('id', id)
    .order('order_index', { foreignTable: 'presentation_items', ascending: true })
    .single();

  if (error) {
    console.error('Error fetching presentation:', error);
    return null;
  }

  return data;
}

export async function createPresentation(presentation: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('presentations')
    .insert([presentation])
    .select()
    .single();

  if (error) {
    console.error('Error creating presentation:', error);
    throw error;
  }

  return data as Presentation;
}

export async function updatePresentation(id: string, updates: Partial<Presentation>) {
  const { data, error } = await supabase
    .from('presentations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating presentation:', error);
    throw error;
  }

  return data as Presentation;
}

export async function deletePresentation(id: string) {
  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting presentation:', error);
    throw error;
  }

  return true;
}

// ========== PRESENTATION ITEMS ==========

export async function getPresentationItems(presentationId: string) {
  const { data, error } = await supabase
    .from('presentation_items')
    .select(`
      *,
      song:songs(*),
      custom_slide:custom_slides(*),
      theme:themes(*),
      video:video_backgrounds(*)
    `)
    .eq('presentation_id', presentationId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching presentation items:', error);
    return [];
  }

  return data as PresentationItem[];
}

export async function addItemToPresentation(item: Omit<PresentationItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('presentation_items')
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error('Error adding item to presentation:', error);
    throw error;
  }

  return data as PresentationItem;
}

export async function updatePresentationItem(id: string, updates: Partial<PresentationItem>) {
  const { data, error } = await supabase
    .from('presentation_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating presentation item:', error);
    throw error;
  }

  return data as PresentationItem;
}

export async function deletePresentationItem(id: string) {
  const { error } = await supabase
    .from('presentation_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting presentation item:', error);
    throw error;
  }

  return true;
}

export async function reorderPresentationItems(items: { id: string; order_index: number }[]) {
  const updates = items.map(item =>
    supabase
      .from('presentation_items')
      .update({ order_index: item.order_index })
      .eq('id', item.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Error reordering items:', errors);
    throw new Error('Failed to reorder items');
  }

  return true;
}

// ========== CUSTOM SLIDES ==========

export async function getAllCustomSlides() {
  const { data, error } = await supabase
    .from('custom_slides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom slides:', error);
    return [];
  }

  return data as CustomSlide[];
}

export async function createCustomSlide(slide: Omit<CustomSlide, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('custom_slides')
    .insert([slide])
    .select()
    .single();

  if (error) {
    console.error('Error creating custom slide:', error);
    throw error;
  }

  return data as CustomSlide;
}

export async function updateCustomSlide(id: string, updates: Partial<CustomSlide>) {
  const { data, error } = await supabase
    .from('custom_slides')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom slide:', error);
    throw error;
  }

  return data as CustomSlide;
}

export async function deleteCustomSlide(id: string) {
  const { error } = await supabase
    .from('custom_slides')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom slide:', error);
    throw error;
  }

  return true;
}

// ========== TAGS ==========

export async function getAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data as Tag[];
}

export async function createTag(tag: Omit<Tag, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('tags')
    .insert([tag])
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    throw error;
  }

  return data as Tag;
}

export async function addTagToSong(songId: string, tagId: string) {
  const { error } = await supabase
    .from('song_tags')
    .insert([{ song_id: songId, tag_id: tagId }]);

  if (error) {
    console.error('Error adding tag to song:', error);
    throw error;
  }

  return true;
}

export async function removeTagFromSong(songId: string, tagId: string) {
  const { error } = await supabase
    .from('song_tags')
    .delete()
    .eq('song_id', songId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from song:', error);
    throw error;
  }

  return true;
}

export async function getSongTags(songId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('song_tags')
    .select('tag:tags(*)')
    .eq('song_id', songId);

  if (error) {
    console.error('Error fetching song tags:', error);
    return [];
  }

  return (data?.map(item => item.tag).filter(Boolean) || []) as unknown as Tag[];
}

// ========== FAVORITES ==========

export async function toggleFavorite(itemType: Favorite['item_type'], itemId: string) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false; // Removed
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      .insert([{ item_type: itemType, item_id: itemId }]);

    if (error) throw error;
    return true; // Added
  }
}

export async function getFavorites(itemType?: Favorite['item_type']) {
  let query = supabase.from('favorites').select('*');

  if (itemType) {
    query = query.eq('item_type', itemType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data as Favorite[];
}

export async function isFavorite(itemType: Favorite['item_type'], itemId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .single();

  return !error && !!data;
}
