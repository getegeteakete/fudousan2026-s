/**
 * サーバーサイド一時トークンストア
 * Supabase未接続時のローカル署名フロー用
 * ※ サーバー再起動でリセットされる（開発・デモ用途）
 */

export interface LocalToken {
  contractId: string;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  contractNo: string;
  agentName: string;
  agentEmail?: string;
  type: string;
  expiresAt: string;
  createdAt: string;
}

// Node.jsグローバルスコープに保存してホットリロード対策
declare global {
  // eslint-disable-next-line no-var
  var __propSignTokenMap: Map<string, LocalToken> | undefined;
}

const getMap = (): Map<string, LocalToken> => {
  if (!global.__propSignTokenMap) {
    global.__propSignTokenMap = new Map();
  }
  return global.__propSignTokenMap;
};

export function setToken(token: string, data: LocalToken): void {
  getMap().set(token, data);
}

export function getToken(token: string): LocalToken | undefined {
  return getMap().get(token);
}

export function deleteToken(token: string): void {
  getMap().delete(token);
}

export function hasToken(token: string): boolean {
  return getMap().has(token);
}
