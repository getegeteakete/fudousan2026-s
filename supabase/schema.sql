-- ============================================================
-- PropSign 不動産電子契約システム - Supabase スキーマ
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ユーザープロファイル（auth.usersに紐付け）
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'viewer')),
  agent_license TEXT,
  company_name TEXT DEFAULT '（株）プロップサイン不動産',
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 物件マスタ
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'マンション' CHECK (type IN ('マンション', '一戸建て', 'アパート', '土地', '事業用')),
  area NUMERIC(8,2),
  rent INTEGER,
  price BIGINT,
  rooms TEXT,
  floor TEXT,
  build_year TEXT,
  owner TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'contracted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 契約書
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_no TEXT NOT NULL UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lease', 'sale', 'mediation', 'management')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'completed', 'expired', 'cancelled')),
  -- 賃借人/買主
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_phone TEXT,
  tenant_address TEXT,
  -- 金額
  rent INTEGER,
  deposit INTEGER,
  key_money INTEGER,
  management_fee INTEGER,
  price BIGINT,
  -- 期間
  start_date DATE,
  end_date DATE,
  -- 宅建士
  agent_name TEXT,
  agent_license TEXT,
  agent_id UUID REFERENCES profiles(id),
  -- 署名
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signature_data TEXT, -- base64 signature image
  signature_token TEXT UNIQUE, -- secure link token
  signature_expires_at TIMESTAMPTZ,
  signature_type TEXT DEFAULT 'witness' CHECK (signature_type IN ('witness', 'party')),
  -- タイムスタンプ
  timestamp_hash TEXT,
  timestamp_at TIMESTAMPTZ,
  -- 特約
  special_terms TEXT,
  -- 作成者
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 監査ログ（不変・append only）
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  event TEXT NOT NULL,
  detail TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 監査ログは削除・更新不可
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- 5. AI トークン使用量トラッキング
-- ============================================================
CREATE TABLE ai_token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN (
    'chat',           -- AIチャット会話
    'generate',       -- 契約書自動生成
    'legal_check',    -- リーガルチェック
    'special_terms',  -- 特約生成
    'summary'         -- 契約サマリ生成
  )),
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  -- Claude Sonnet 4 pricing: $3/M input, $15/M output (USD)
  cost_usd NUMERIC(10,6) GENERATED ALWAYS AS (
    (input_tokens::NUMERIC / 1000000 * 3) + (output_tokens::NUMERIC / 1000000 * 15)
  ) STORED,
  response_ms INTEGER, -- レスポンス時間
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. システム設定
-- ============================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('company_name', '（株）プロップサイン不動産', '会社名'),
  ('company_address', '東京都渋谷区道玄坂1-1-1', '所在地'),
  ('company_phone', '03-1234-5678', '電話番号'),
  ('company_email', 'info@propsign.co.jp', 'メール'),
  ('license_no', '東京都知事（3）第○○○○○号', '宅建業免許番号'),
  ('signature_expiry_days', '7', '署名有効期限（日）'),
  ('signature_type', 'witness', '署名タイプ'),
  ('mfa_required', 'true', 'MFA必須化'),
  ('timestamp_enabled', 'true', 'タイムスタンプ自動付与'),
  ('monthly_ai_budget_usd', '50', 'AI月次予算（USD）'),
  ('ai_token_alert_threshold', '80', 'AI予算アラート閾値（%）');

-- ============================================================
-- 7. インデックス
-- ============================================================
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_tenant_email ON contracts(tenant_email);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX idx_audit_logs_contract_id ON audit_logs(contract_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_ai_token_usage_user_id ON ai_token_usage(user_id);
CREATE INDEX idx_ai_token_usage_created_at ON ai_token_usage(created_at DESC);
CREATE INDEX idx_ai_token_usage_operation ON ai_token_usage(operation);
CREATE INDEX idx_properties_status ON properties(status);

-- ============================================================
-- 8. Row Level Security (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- プロファイル：自分のみ閲覧・編集（adminは全員）
CREATE POLICY "profiles_self" ON profiles FOR ALL USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 物件：認証済みユーザーは全件読み取り、作成者/adminが編集
CREATE POLICY "properties_read" ON properties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "properties_write" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "properties_update" ON properties FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 契約：認証済みで全件読み取り（同社内）
CREATE POLICY "contracts_read" ON contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contracts_write" ON contracts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "contracts_update" ON contracts FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 監査ログ：読み取りのみ
CREATE POLICY "audit_read" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AIトークン：自分の記録のみ（adminは全件）
CREATE POLICY "ai_usage_read" ON ai_token_usage FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ai_usage_insert" ON ai_token_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- システム設定：adminのみ編集、全員読み取り
CREATE POLICY "settings_read" ON system_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "settings_write" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 9. ビュー（集計用）
-- ============================================================

-- AI月次トークン集計ビュー
CREATE VIEW ai_monthly_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  user_id,
  operation,
  model,
  SUM(input_tokens) AS total_input,
  SUM(output_tokens) AS total_output,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  COUNT(*) AS call_count,
  AVG(response_ms) AS avg_response_ms
FROM ai_token_usage
GROUP BY 1, 2, 3, 4;

-- AI日次集計
CREATE VIEW ai_daily_stats AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  operation,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  COUNT(*) AS call_count
FROM ai_token_usage
GROUP BY 1, 2;

-- 契約ステータス集計
CREATE VIEW contract_summary AS
SELECT
  status,
  COUNT(*) AS count,
  DATE_TRUNC('month', created_at) AS month
FROM contracts
GROUP BY 1, 3;

-- ============================================================
-- 10. トリガー（updated_at自動更新）
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 契約番号自動採番
CREATE OR REPLACE FUNCTION generate_contract_no()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM contracts WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', NOW());
  NEW.contract_no := 'PS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_contract_no BEFORE INSERT ON contracts
  FOR EACH ROW WHEN (NEW.contract_no IS NULL OR NEW.contract_no = '')
  EXECUTE FUNCTION generate_contract_no();

-- ============================================================
-- 11. 署名トークン生成関数
-- ============================================================
CREATE OR REPLACE FUNCTION generate_signature_token(contract_id UUID, expiry_days INT DEFAULT 7)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(32), 'hex');
  UPDATE contracts
  SET signature_token = token,
      signature_expires_at = NOW() + (expiry_days || ' days')::INTERVAL
  WHERE id = contract_id;
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
