// Generate a short UUID (6-10 characters) for character identification
export const generateShortUUID = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate if a string is a valid short UUID format
export const isValidShortUUID = (uuid: string): boolean => {
  return /^[A-Za-z0-9]{6,10}$/.test(uuid);
}; 