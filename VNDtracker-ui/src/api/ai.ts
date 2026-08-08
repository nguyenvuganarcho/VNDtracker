import client from './client';
import type { ApiResponse, ScanReceiptResult } from '../types';

export const scanReceiptApi = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  // Let the browser set the multipart Content-Type (with boundary) itself --
  // the client instance's default 'application/json' header would otherwise
  // win and break the upload.
  const response = await client.post<ApiResponse<ScanReceiptResult>>('/ai/scan', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};
