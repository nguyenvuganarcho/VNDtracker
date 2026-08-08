import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { AiService } from './ai.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import { uploadReceiptImage } from '../../config/upload';

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

        const imageBuffer = fs.readFileSync(req.file.path);
        const result = await this.service.scanReceipt(req.user!.userId, imageBuffer, req.file.mimetype);

        return res.status(200).json(
          ApiResponse.success('Scan complete', { ...result, receiptImagePath: `/uploads/${req.file.filename}` }, req.path)
        );
      } catch (e) {
        next(e);
      }
    });
  };
}
