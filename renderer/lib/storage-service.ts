import { supabase } from './supabase';

const BUCKET_NAME = 'videos';

// Initialize storage bucket (run this once)
export async function initializeStorage() {
  const { data: buckets } = await supabase.storage.listBuckets();

  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }

    console.log('Storage bucket created:', data);
  }
}

export async function uploadVideo(file: File, onProgress?: (progress: number) => void) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading video:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url: publicUrl,
    fileName: file.name,
  };
}

export async function deleteVideo(path: string) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Error deleting video:', error);
    throw error;
  }

  return true;
}

export async function listVideos() {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list();

  if (error) {
    console.error('Error listing videos:', error);
    return [];
  }

  return data;
}

export function getVideoPublicUrl(path: string) {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}
