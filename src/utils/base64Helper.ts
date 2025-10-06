export const encodeCredentials = (email: string, password: string): string => {
  const query = `email=${email}&pass=${password}`;
  const encoded = Buffer.from(query, 'utf-8').toString('base64');
  return encoded;
};

export const decodeCredentials = (
  encoded: string,
): {email: string | null; password: string | null} | null => {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const params = new URLSearchParams(decoded);

    return {
      email: params.get('email'),
      password: params.get('pass'),
    };
  } catch (error) {
    console.error('Failed to decode credentials:', error);
    return null;
  }
};
