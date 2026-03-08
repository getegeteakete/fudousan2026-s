export type ContractStatus = 'draft' | 'pending' | 'signed' | 'completed' | 'expired';
export type ContractType = 'lease' | 'sale' | 'mediation' | 'management';

export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  area: number;
  rent?: number;
  price?: number;
  rooms: string;
  floor?: string;
  buildYear?: string;
  owner: string;
  ownerEmail: string;
  ownerPhone: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  type: ContractType;
  status: ContractStatus;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  agentName: string;
  agentLicense: string;
  rent?: number;
  deposit?: number;
  keyMoney?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  signedAt?: string;
  signerIp?: string;
  auditLog: AuditEntry[];
  notes?: string;
  specialTerms?: string;
}

export interface AuditEntry {
  timestamp: string;
  event: string;
  detail: string;
  ip?: string;
  userId?: string;
}

export const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'p001',
    name: 'グランドハイツ渋谷 302号室',
    address: '東京都渋谷区道玄坂2-10-12',
    type: 'マンション',
    area: 48.5,
    rent: 148000,
    rooms: '1LDK',
    floor: '3階',
    buildYear: '2018年',
    owner: '田中 建設株式会社',
    ownerEmail: 'tanaka@estate.example.com',
    ownerPhone: '03-1234-5678',
  },
  {
    id: 'p002',
    name: 'ライオンズマンション新宿 1201号室',
    address: '東京都新宿区西新宿5-3-8',
    type: 'マンション',
    area: 65.2,
    rent: 215000,
    rooms: '2LDK',
    floor: '12階',
    buildYear: '2015年',
    owner: '株式会社新宿プロパティ',
    ownerEmail: 'info@shinjuku-prop.example.com',
    ownerPhone: '03-9876-5432',
  },
  {
    id: 'p003',
    name: '世田谷区用賀 一戸建て',
    address: '東京都世田谷区用賀3-7-15',
    type: '一戸建て',
    area: 110.0,
    price: 62000000,
    rooms: '4LDK',
    buildYear: '2010年',
    owner: '山田 太郎',
    ownerEmail: 'yamada@example.com',
    ownerPhone: '080-1234-5678',
  },
  {
    id: 'p004',
    name: 'コスモシティ品川 B棟 405号室',
    address: '東京都品川区大崎1-11-2',
    type: 'マンション',
    area: 35.8,
    rent: 95000,
    rooms: '1K',
    floor: '4階',
    buildYear: '2020年',
    owner: '品川コーポレーション株式会社',
    ownerEmail: 'corp@shinagawa.example.com',
    ownerPhone: '03-5555-6666',
  },
  {
    id: 'p005',
    name: 'パークサイド目黒 705号室',
    address: '東京都目黒区目黒本町2-5-10',
    type: 'マンション',
    area: 78.3,
    rent: 285000,
    rooms: '3LDK',
    floor: '7階',
    buildYear: '2019年',
    owner: '目黒不動産合同会社',
    ownerEmail: 'meguro@prop.example.com',
    ownerPhone: '03-7777-8888',
  },
];

export const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: 'c001',
    contractNo: 'PS-2025-0001',
    type: 'lease',
    status: 'completed',
    propertyId: 'p001',
    propertyName: 'グランドハイツ渋谷 302号室',
    propertyAddress: '東京都渋谷区道玄坂2-10-12',
    tenantName: '佐藤 花子',
    tenantEmail: 'hanako.sato@example.com',
    tenantPhone: '090-1111-2222',
    agentName: '鈴木 宅建士',
    agentLicense: '東京都知事（3）第123456号',
    rent: 148000,
    deposit: 296000,
    keyMoney: 148000,
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    createdAt: '2025-03-01T10:00:00',
    updatedAt: '2025-03-10T15:30:00',
    sentAt: '2025-03-05T11:00:00',
    signedAt: '2025-03-10T15:30:00',
    signerIp: '192.168.1.xxx',
    auditLog: [
      { timestamp: '2025-03-01T10:00:00', event: '契約書作成', detail: 'ドラフト生成', userId: 'agent01' },
      { timestamp: '2025-03-02T09:30:00', event: '宅建士確認', detail: '重要事項説明書レビュー完了', userId: 'agent01' },
      { timestamp: '2025-03-05T11:00:00', event: '署名依頼送信', detail: 'メール送信完了 → hanako.sato@example.com', ip: '10.0.0.1' },
      { timestamp: '2025-03-10T15:25:00', event: 'ドキュメント閲覧', detail: '契約書・重説 閲覧確認', ip: '192.168.1.xxx' },
      { timestamp: '2025-03-10T15:30:00', event: '電子署名完了', detail: 'タイムスタンプ付与・署名済み', ip: '192.168.1.xxx' },
    ],
  },
  {
    id: 'c002',
    contractNo: 'PS-2025-0002',
    type: 'lease',
    status: 'pending',
    propertyId: 'p002',
    propertyName: 'ライオンズマンション新宿 1201号室',
    propertyAddress: '東京都新宿区西新宿5-3-8',
    tenantName: '高橋 次郎',
    tenantEmail: 'jiro.takahashi@example.com',
    tenantPhone: '080-3333-4444',
    agentName: '田中 宅建士',
    agentLicense: '東京都知事（2）第654321号',
    rent: 215000,
    deposit: 430000,
    keyMoney: 215000,
    startDate: '2025-05-01',
    endDate: '2027-04-30',
    createdAt: '2025-03-15T09:00:00',
    updatedAt: '2025-03-20T14:00:00',
    sentAt: '2025-03-20T14:00:00',
    auditLog: [
      { timestamp: '2025-03-15T09:00:00', event: '契約書作成', detail: 'CSVデータから自動生成', userId: 'agent02' },
      { timestamp: '2025-03-18T10:00:00', event: 'AIリーガルチェック', detail: 'リスク項目2件を確認・修正', userId: 'agent02' },
      { timestamp: '2025-03-20T14:00:00', event: '署名依頼送信', detail: 'SMS・メール送信完了', ip: '10.0.0.2' },
    ],
  },
  {
    id: 'c003',
    contractNo: 'PS-2025-0003',
    type: 'sale',
    status: 'draft',
    propertyId: 'p003',
    propertyName: '世田谷区用賀 一戸建て',
    propertyAddress: '東京都世田谷区用賀3-7-15',
    tenantName: '伊藤 三郎',
    tenantEmail: 'saburo.ito@example.com',
    tenantPhone: '090-5555-6666',
    agentName: '中村 宅建士',
    agentLicense: '東京都知事（4）第789012号',
    startDate: '2025-04-15',
    createdAt: '2025-03-25T11:00:00',
    updatedAt: '2025-03-25T11:00:00',
    auditLog: [
      { timestamp: '2025-03-25T11:00:00', event: '契約書作成', detail: '売買契約書ドラフト生成', userId: 'agent03' },
    ],
    specialTerms: '引渡し後の設備保証期間3ヶ月。',
  },
  {
    id: 'c004',
    contractNo: 'PS-2025-0004',
    type: 'lease',
    status: 'signed',
    propertyId: 'p004',
    propertyName: 'コスモシティ品川 B棟 405号室',
    propertyAddress: '東京都品川区大崎1-11-2',
    tenantName: '渡辺 四郎',
    tenantEmail: 'shiro.watanabe@example.com',
    tenantPhone: '070-7777-8888',
    agentName: '松本 宅建士',
    agentLicense: '東京都知事（1）第345678号',
    rent: 95000,
    deposit: 190000,
    keyMoney: 0,
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    createdAt: '2025-03-10T08:00:00',
    updatedAt: '2025-03-28T16:00:00',
    sentAt: '2025-03-22T10:00:00',
    signedAt: '2025-03-28T16:00:00',
    auditLog: [
      { timestamp: '2025-03-10T08:00:00', event: '契約書作成', detail: '賃貸借契約書生成', userId: 'agent04' },
      { timestamp: '2025-03-22T10:00:00', event: '署名依頼送信', detail: 'メール送信完了', ip: '10.0.0.4' },
      { timestamp: '2025-03-28T15:55:00', event: 'ドキュメント閲覧', detail: '3分間閲覧', ip: '203.0.113.xxx' },
      { timestamp: '2025-03-28T16:00:00', event: '電子署名', detail: '借主署名完了（立会人型）', ip: '203.0.113.xxx' },
    ],
  },
];

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: '下書き',
  pending: '署名待ち',
  signed: '署名済み',
  completed: '締結完了',
  expired: '期限切れ',
};

export const TYPE_LABELS: Record<ContractType, string> = {
  lease: '賃貸借契約',
  sale: '売買契約',
  mediation: '媒介契約',
  management: '管理委託契約',
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);

export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};
