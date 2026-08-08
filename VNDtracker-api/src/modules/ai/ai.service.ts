import Anthropic from '@anthropic-ai/sdk';
import { CategoryRepository } from '../category/category.repo';
import { ScanReceiptResult } from './ai.dto';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

interface ExtractedToolInput {
  inputType: 'bill' | 'transfer';
  expenseDate?: string;
  amount: number;
  note: string;
  categoryId?: number | null;
}

export class AiService {
  private anthropic: Anthropic;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.categoryRepo = new CategoryRepository();
  }

  async scanReceipt(userId: number, imageBuffer: Buffer, mimeType: string): Promise<ScanReceiptResult> {
    const categories = await this.categoryRepo.findAllForUser(userId);
    const categoryOptions = categories.map((c) => ({
      id: c.categoryId,
      label: c.name || c.nameKey || 'Unknown',
    }));
    const fallbackCategoryId = categories.find((c) => c.isDefault && c.nameKey === 'other')?.categoryId ?? null;

    try {
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        tool_choice: { type: 'tool', name: 'extract_receipt_data' },
        tools: [
          {
            name: 'extract_receipt_data',
            description:
              'Extract structured expense data from a photo of a purchase receipt or a bank transfer confirmation screenshot',
            input_schema: {
              type: 'object',
              properties: {
                inputType: {
                  type: 'string',
                  enum: ['bill', 'transfer'],
                  description: 'Whether the photo is a purchase receipt/bill or a bank transfer confirmation',
                },
                expenseDate: {
                  type: 'string',
                  description: 'Transaction date in YYYY-MM-DD format, if legible',
                },
                amount: {
                  type: 'integer',
                  description: 'Total amount in Vietnamese Dong (VND) as a whole integer, no decimals',
                },
                note: {
                  type: 'string',
                  description:
                    'A short one-line description: for a bill, briefly summarize what was purchased; for a transfer, use its content/memo field. Never include the merchant or store name.',
                },
                categoryId: {
                  type: ['integer', 'null'],
                  description: 'Best matching category id from the provided list, or null if none clearly fits',
                },
              },
              required: ['inputType', 'amount', 'note'],
            },
          },
        ],
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: imageBuffer.toString('base64') },
              },
              {
                type: 'text',
                text: `This image is either a purchase receipt/bill or a bank transfer confirmation screenshot. Extract the expense data and call extract_receipt_data.\n\nAvailable categories (id: label):\n${categoryOptions.map((c) => `${c.id}: ${c.label}`).join('\n')}`,
              },
            ],
          },
        ],
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUse) {
        throw new Error('Model did not return a tool_use block');
      }

      const data = toolUse.input as ExtractedToolInput;

      const validCategoryId =
        data.categoryId != null && categories.some((c) => c.categoryId === data.categoryId)
          ? data.categoryId
          : fallbackCategoryId;

      return {
        aiReadable: true,
        inputType: data.inputType,
        expenseDate: data.expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(data.expenseDate) ? data.expenseDate : null,
        amount: Number.isFinite(data.amount) && data.amount > 0 ? Math.round(data.amount) : null,
        note: data.note || '',
        categoryId: validCategoryId,
      };
    } catch (error) {
      console.error('AI receipt scan failed:', error);
      return {
        aiReadable: false,
        inputType: null,
        expenseDate: null,
        amount: null,
        note: '',
        categoryId: fallbackCategoryId,
      };
    }
  }
}
