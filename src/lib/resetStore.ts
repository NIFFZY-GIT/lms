// Simple in-memory password reset code store. In production, use DB or cache (Redis).
export type ResetRecord = { code: string; expiresAt: number };
const store = new Map<string, ResetRecord>();

export function setResetCode(userId: string, record: ResetRecord) {
  store.set(userId, record);
}

export function getResetCode(userId: string): ResetRecord | undefined {
  return store.get(userId);
}

export function clearResetCode(userId: string) {
  store.delete(userId);
}
