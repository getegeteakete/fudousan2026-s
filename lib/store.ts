// PropSign ローカルストア - Supabase未接続でも全機能動作
const P = 'propsign_';

export function lsGet<T>(key: string, fb: T): T {
  if (typeof window === 'undefined') return fb;
  try { const v = localStorage.getItem(P + key); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
export function lsSet<T>(key: string, val: T) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(P + key, JSON.stringify(val)); } catch {}
}

// ── 設定 ──────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  companyName: '（株）プロップサイン不動産',
  companyAddress: '東京都渋谷区道玄坂1-1-1',
  companyPhone: '03-1234-5678',
  companyEmail: 'info@propsign.co.jp',
  licenseNo: '東京都知事（3）第○○○○○号',
  agentName: '山田 一郎',
  agentLicense: '東京都知事（3）第123456号',
  signatureExpiry: '7',
  signatureType: 'witness',
  timestampEnabled: true,
  mfaRequired: true,
  reminderDays: '3',
  emailFrom: 'contract@propsign.co.jp',
  notifyOnSend: true,
  notifyOnSigned: true,
  notifyOnExpiry: true,
  notifyOnComplete: true,
  monthlyBudgetUsd: '50',
};
export type AppSettings = typeof DEFAULT_SETTINGS;

export const getSettings = (): AppSettings => lsGet<AppSettings>('settings', DEFAULT_SETTINGS);
export const saveSettings = (s: AppSettings) => lsSet('settings', s);

// ── 契約書 ─────────────────────────────────────────────────
import type { Contract } from './data';

export const getLocalContracts = (): Contract[] => lsGet<Contract[]>('contracts', []);
export function saveLocalContract(c: Contract) {
  const list = getLocalContracts();
  const idx = list.findIndex(x => x.id === c.id);
  if (idx >= 0) list[idx] = c; else list.unshift(c);
  lsSet('contracts', list);
}
export function deleteLocalContract(id: string) {
  lsSet('contracts', getLocalContracts().filter(c => c.id !== id));
}

// ── 物件 ───────────────────────────────────────────────────
import type { Property } from './data';

export const getLocalProperties = (): Property[] => lsGet<Property[]>('properties', []);
export function saveLocalProperties(props: Property[]) {
  const existing = getLocalProperties();
  const map = new Map(existing.map(p => [p.id, p]));
  props.forEach(p => map.set(p.id, p));
  lsSet('properties', Array.from(map.values()));
}

// ── 顧客 ───────────────────────────────────────────────────
import type { Customer } from './data';

export const getLocalCustomers = (): Customer[] => lsGet<Customer[]>('customers', []);
export function saveLocalCustomer(cu: Customer) {
  const list = getLocalCustomers();
  const idx = list.findIndex(x => x.id === cu.id);
  if (idx >= 0) list[idx] = cu; else list.unshift(cu);
  lsSet('customers', list);
}
export function deleteLocalCustomer(id: string) {
  lsSet('customers', getLocalCustomers().filter(c => c.id !== id));
}
