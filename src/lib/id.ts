import { randomBytes } from 'crypto';

export const generateId = (prefix: string) => `${prefix}_${randomBytes(12).toString('hex')}`;
