import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Memory storage: hands the buffer straight to the AI call and to
// saveReceiptImage (config/storage.ts), which decides where it ends up
// (local disk for dev, Supabase Storage in production) — multer itself
// never touches disk.
export const uploadReceiptImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
}).single('image');
