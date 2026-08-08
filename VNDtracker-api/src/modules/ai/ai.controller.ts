import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import { uploadReceiptImage } from '../../config/upload';
import { saveReceiptImage } from '../../config/storage';

export class AiController {
  private service: AiService;

  constructor() {
    this.service = new AiService();
  }

  // POST /api/ai/scan (multipart, field name "image")
  scan = (req: Request, res: Response, next: NextFunction) => {
    uploadReceiptImage(req, res, async (err: any) => {
      try {
        if (err) {
          if (err.message === 'INVALID_FILE_TYPE') {
            throw new ValidationError([
              { field: 'image', message: 'Only JPG, PNG, or WEBP images are allowed' },
            ]);
          }
          if (err.code === 'LIMIT_FILE_SIZE') {
            throw new ValidationError([{ field: 'image', message: 'Image must be under 5MB' }]);
          }
          throw err;
        }

        if (!req.file) {
          throw new ValidationError([{ field: 'image', message: 'Image is required' }]);
        }

        const imageBuffer = req.file.buffer;
        const [result, receiptImagePath] = await Promise.all([
          this.service.scanReceipt(req.user!.userId, imageBuffer, req.file.mimetype),
          saveReceiptImage(imageBuffer, req.file.mimetype),
        ]);

        return res.status(200).json(
          ApiResponse.success('Scan complete', { ...result, receiptImagePath }, req.path)
        );
      } catch (e) {
        next(e);
      }
    });
  };
}
