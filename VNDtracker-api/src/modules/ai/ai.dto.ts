export interface ScanReceiptResult {
  aiReadable: boolean;
  inputType: 'bill' | 'transfer' | null;
  expenseDate: string | null;
  amount: number | null;
  note: string;
  categoryId: number | null;
}

export interface ScanReceiptResponse extends ScanReceiptResult {
  receiptImagePath: string;
}
