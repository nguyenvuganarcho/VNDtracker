// JWT secret access with a hard startup requirement. A missing JWT_SECRET
// must crash the process, never fall back to a guessable default -- a public
// repo plus a known fallback secret would let anyone forge tokens.
let cachedSecret: string | undefined;

export const getJwtSecret = (): string => {
  if (!cachedSecret) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    cachedSecret = secret;
  }
  return cachedSecret;
};
