import path from 'path';
import fs from 'fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const uploadsDir = path.join(__dirname, '../../uploads');

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const generateFilename = (mimetype: string) =>
  `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXT_BY_MIME[mimetype] || ''}`;

let supabase: SupabaseClient | null = null;
const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  }
  return supabase;
};

// Local disk (default) needs no setup and is fine for dev, but most PaaS
// free tiers (Render included) wipe the filesystem on every deploy/restart,
// so production must set STORAGE_DRIVER=supabase to persist receipt images
// in a real bucket instead.
export const saveReceiptImage = async (buffer: Buffer, mimetype: string): Promise<string> => {
  const filename = generateFilename(mimetype);

  if (process.env.STORAGE_DRIVER === 'supabase') {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'receipts';
    const { error } = await getSupabase()
      .storage.from(bucket)
      .upload(filename, buffer, { contentType: mimetype });
    if (error) {
      throw error;
    }
    const { data } = getSupabase().storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
};
