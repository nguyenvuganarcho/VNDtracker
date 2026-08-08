export class ApiResponse {
  static success<T>(message: string, data: T, path: string) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static fail(message: string, errorCode: string, path: string, details?: any) {
    return {
      success: false,
      message,
      error: {
        code: errorCode,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
