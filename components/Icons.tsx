// 一筆書き風スタンプアイコン集 - すべてSVGで描画
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

const defaultProps = { size: 20, color: 'currentColor', strokeWidth: 1.8 };

// ダッシュボード - 家紋風の格子
export function IconDashboard({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3 L21 3 L21 21 L3 21 Z" />
      <path d="M3 12 L21 12" />
      <path d="M12 3 L12 21" />
    </svg>
  );
}

// 契約書 - 巻物風
export function IconContracts({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 C4 2 4 4 4 4 L4 20 C4 20 4 22 6 22 L18 22 C20 22 20 20 20 20 L20 4 C20 4 20 2 18 2 Z" />
      <path d="M8 7 L16 7" />
      <path d="M8 11 L16 11" />
      <path d="M8 15 L13 15" />
    </svg>
  );
}

// 新規作成 - 筆と紙
export function IconNewContract({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2 L20 8 L8 20 L2 22 L4 16 Z" />
      <path d="M14 2 L20 8" />
      <path d="M12 4 L4 20" />
    </svg>
  );
}

// 物件 - 屋根と柱
export function IconProperties({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 L12 3 L21 10" />
      <path d="M5 10 L5 21 L19 21 L19 10" />
      <path d="M9 21 L9 14 L15 14 L15 21" />
    </svg>
  );
}

// セキュリティ - 家紋風の盾
export function IconSecurity({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L4 6 L4 13 C4 17.4 7.4 21.5 12 22 C16.6 21.5 20 17.4 20 13 L20 6 Z" />
      <path d="M9 12 L11 14 L15 10" />
    </svg>
  );
}

// 設定 - 算盤珠風
export function IconSettings({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2 L12 5" />
      <path d="M12 19 L12 22" />
      <path d="M4.22 4.22 L6.34 6.34" />
      <path d="M17.66 17.66 L19.78 19.78" />
      <path d="M2 12 L5 12" />
      <path d="M19 12 L22 12" />
      <path d="M4.22 19.78 L6.34 17.66" />
      <path d="M17.66 6.34 L19.78 4.22" />
    </svg>
  );
}

// 通知 - 鈴
export function IconBell({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 C12 2 8 4 8 10 L8 16 L4 18 L20 18 L16 16 L16 10 C16 4 12 2 12 2 Z" />
      <path d="M10 18 C10 19.1 10.9 20 12 20 C13.1 20 14 19.1 14 18" />
    </svg>
  );
}

// 検索 - 虫眼鏡
export function IconSearch({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M15 15 L22 22" />
    </svg>
  );
}

// チェック - 勾玉風
export function IconCheck({ size = 20, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 L9 17 L20 6" />
    </svg>
  );
}

// 警告 - 鳥居風三角
export function IconAlert({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L22 20 L2 20 Z" />
      <path d="M12 10 L12 14" />
      <circle cx="12" cy="17" r="0.5" fill={color} />
    </svg>
  );
}

// 送信 - 折り鶴の翼風
export function IconSend({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 L11 13" />
      <path d="M22 2 L15 22 L11 13 L2 9 Z" />
    </svg>
  );
}

// ダウンロード - 矢印
export function IconDownload({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L12 16" />
      <path d="M7 12 L12 17 L17 12" />
      <path d="M3 20 L21 20" />
    </svg>
  );
}

// アップロード - 雲
export function IconUpload({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16 L12 3" />
      <path d="M7 8 L12 3 L17 8" />
      <path d="M6 20 C3.8 20 2 18.2 2 16 C2 14.1 3.3 12.5 5.1 12.1 C5 11.7 5 11.4 5 11 C5 8.2 7.2 6 10 6 C10.7 6 11.4 6.2 12 6.4" />
      <path d="M18 20 C20.2 20 22 18.2 22 16 C22 14.1 20.7 12.5 18.9 12.1" />
    </svg>
  );
}

// ロック - 錠
export function IconLock({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="11" rx="2" />
      <path d="M8 11 L8 7 C8 4.8 9.8 3 12 3 C14.2 3 16 4.8 16 7 L16 11" />
      <circle cx="12" cy="16" r="1" fill={color} />
    </svg>
  );
}

// ユーザー - 人影
export function IconUser({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M3 21 C3 17.1 7.1 14 12 14 C16.9 14 21 17.1 21 21" />
    </svg>
  );
}

// 閉じる - 花びら風
export function IconClose({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 L6 18" />
      <path d="M6 6 L18 18" />
    </svg>
  );
}

// メニュー - 三本線（筆置き）
export function IconMenu({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6 L21 6" />
      <path d="M3 12 L21 12" />
      <path d="M3 18 L21 18" />
    </svg>
  );
}

// AI - 水晶玉風
export function IconAI({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8 L12 12 L15 15" />
      <path d="M8 5 C8 5 6 7 7 10" />
      <path d="M16 5 C16 5 18 7 17 10" />
    </svg>
  );
}

// マイク - 音声
export function IconMic({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10 C5 14.4 8.1 18 12 18 C15.9 18 19 14.4 19 10" />
      <path d="M12 18 L12 22" />
      <path d="M8 22 L16 22" />
    </svg>
  );
}

// マイクオフ
export function IconMicOff({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1 L23 23" />
      <path d="M9 9 L9 14 C9 15.7 10.3 17 12 17 C12.7 17 13.4 16.8 13.9 16.3" />
      <path d="M15 9.3 L15 14 C15 15.7 13.7 17 12 17" />
      <path d="M5 10 C5 14.4 8.1 18 12 18 C15.9 18 19 14.4 19 10" />
      <path d="M12 18 L12 22" />
    </svg>
  );
}

// フィルター
export function IconFilter({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4 L21 4 L14 12 L14 20 L10 18 L10 12 Z" />
    </svg>
  );
}

// 追加 - 円に十字
export function IconPlus({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8 L12 16" />
      <path d="M8 12 L16 12" />
    </svg>
  );
}

// 右矢印
export function IconArrow({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12 L19 12" />
      <path d="M14 7 L19 12 L14 17" />
    </svg>
  );
}

// 戻る
export function IconBack({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12 L5 12" />
      <path d="M10 17 L5 12 L10 7" />
    </svg>
  );
}

// 時計
export function IconClock({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 L12 12 L15 15" />
    </svg>
  );
}

// 印鑑・はんこ
export function IconStamp({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6" />
      <path d="M8 10 L12 6 L16 10 L16 14 L8 14 Z" />
      <path d="M9 21 L15 21" />
      <path d="M12 16 L12 21" />
    </svg>
  );
}

// WiFi - 電波
export function IconWifi({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9 C6.4 4.7 12 3 12 3 C12 3 17.6 4.7 22 9" />
      <path d="M5 12.5 C7.8 9.7 10 8.5 12 8.5 C14 8.5 16.2 9.7 19 12.5" />
      <path d="M8 16 C9.4 14.6 10.7 14 12 14 C13.3 14 14.6 14.6 16 16" />
      <circle cx="12" cy="19" r="1" fill={color} />
    </svg>
  );
}

// データベース
export function IconDatabase({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5 L3 19 C3 20.7 7.1 22 12 22 C16.9 22 21 20.7 21 19 L21 5" />
      <path d="M3 12 C3 13.7 7.1 15 12 15 C16.9 15 21 13.7 21 12" />
    </svg>
  );
}

// キー
export function IconKey({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="9" r="5" />
      <path d="M11.5 12 L22 22" />
      <path d="M17 17 L19 19" />
      <path d="M20 14 L22 16" />
    </svg>
  );
}

// 目（閲覧）
export function IconEye({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 C5 6 9 3 12 3 C15 3 19 6 22 12 C19 18 15 21 12 21 C9 21 5 18 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// 筆（電子署名）
export function IconSign({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3 C18.1 3 19 3.9 19 5 L7 17 L3 21 L7 17 L19 5" />
      <path d="M15 5 L19 9" />
      <path d="M3 21 C7 19 11 17 15 19 C17 20 19 21 21 21" />
    </svg>
  );
}

// トレンド（統計）
export function IconTrend({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18 L8 12 L13 15 L21 6" />
      <path d="M17 6 L21 6 L21 10" />
    </svg>
  );
}

// スパークル（AI生成）
export function IconSparkle({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" />
      <path d="M19 3 L19.5 5.5 L22 6 L19.5 6.5 L19 9 L18.5 6.5 L16 6 L18.5 5.5 Z" />
    </svg>
  );
}

// チャット
export function IconChat({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15 C21 16.1 20.1 17 19 17 L7 17 L3 21 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5 Z" />
      <path d="M8 9 L16 9" />
      <path d="M8 13 L13 13" />
    </svg>
  );
}

// ファイル・CSV
export function IconCSV({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2 L20 8 L20 22 L4 22 L4 2 Z" />
      <path d="M14 2 L14 8 L20 8" />
      <path d="M7 13 L10 13 L10 18 L7 18" />
      <path d="M13 13 L17 18" />
      <path d="M17 13 L13 18" />
    </svg>
  );
}
