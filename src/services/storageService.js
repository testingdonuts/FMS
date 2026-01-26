import { supabase } from '../lib/supabase';

const generateFileName = (file) => {
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${cleanName}_${new Date().getTime()}.${fileExt}`;
};

export const storageService = {
  async uploadFile(bucketName, file) {
    try {
      const targetBucket = bucketName || 'listings';
      const fileName = generateFileName(file);
      
      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('not found')) {
          throw new Error(`Bucket '${targetBucket}' not found. Please create it in Supabase Storage and enable Public Access.`);
        }
        throw uploadError;
      }

      // Get the URL
      const { data: { publicUrl } } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(data.path);

      // Return the full URL immediately
      return { data: { publicUrl, path: data.path }, error: null };
    } catch (error) {
      console.error('Storage upload error:', error);
      return { data: null, error: error.message };
    }
  },

  async uploadMultipleFiles(bucketName, files) {
    try {
      const results = await Promise.all(
        files.map(file => this.uploadFile(bucketName, file))
      );
      
      const urls = results.filter(r => !r.error).map(r => r.data.publicUrl);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      return { 
        data: urls, 
        error: errors.length > 0 ? errors[0] : null 
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  validateImageFile(file) {
    if (!file.type.startsWith('image/')) return { valid: false, error: 'File must be an image' };
    if (file.size > 5 * 1024 * 1024) return { valid: false, error: 'Max size is 5MB' };
    return { valid: true, error: null };
  }
};