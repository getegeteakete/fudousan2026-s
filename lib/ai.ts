import { createAdminSupabase } from './supabase';

type TokenOperation = 'chat' | 'generate' | 'legal_check' | 'special_terms' | 'summary';

interface AICallOptions {
  userId?: string;
  contractId?: string;
  operation: TokenOperation;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  model?: string;
}

interface AICallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  responseMs: number;
}

const MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

// Claude Sonnet 4 pricing (USD per 1M tokens)
const PRICING = { input: 3.0, output: 15.0 };

// ─── メイン AI 呼び出し関数 ─────────────────────────────────
export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const start = Date.now();
  const { operation, userId, contractId, system, messages, maxTokens = 1500, model = MODEL } = opts;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません');

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API エラー: ${res.status} ${err}`);
  }

  const data = await res.json();
  const responseMs = Date.now() - start;

  const text = data.content?.[0]?.text ?? '';
  const inputTokens: number = data.usage?.input_tokens ?? 0;
  const outputTokens: number = data.usage?.output_tokens ?? 0;
  const totalTokens = inputTokens + outputTokens;
  const costUsd = (inputTokens / 1_000_000 * PRICING.input) + (outputTokens / 1_000_000 * PRICING.output);

  // ─── Supabase にトークン使用量を記録 ─────────────────────
  try {
    const supabase = createAdminSupabase();
    await supabase.from('ai_token_usage').insert({
      user_id: userId ?? null,
      contract_id: contractId ?? null,
      operation,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      response_ms: responseMs,
      metadata: { messages_count: messages.length },
    });
  } catch (e) {
    // トークン記録失敗はサイレントに処理（本体は続行）
    console.error('Token tracking error:', e);
  }

  return { text, inputTokens, outputTokens, totalTokens, costUsd, responseMs };
}

// ─── 契約書自動生成 ─────────────────────────────────────────
const GENERATE_SYSTEM = `あなたは日本の不動産取引に精通した法律文書AIです。
宅地建物取引業法・民法・借地借家法に完全準拠した正確な契約書条文を日本語で生成します。

重要なルール：
- すべての条項は現行法令に準拠すること
- 宅建業法35条・37条の要件を満たすこと  
- 電子帳簿保存法の要件に適合した文言を使用すること
- 金額は「〇〇円」形式で明記すること
- 日付は「令和〇年〇月〇日」形式で記載すること
- AIが作成したドラフトである旨を末尾に付記すること

最終的な法的確認は必ず宅地建物取引士が行うことを前提に作成してください。`;

export async function generateContractText(params: {
  userId: string;
  contractId?: string;
  type: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  rent?: number;
  deposit?: number;
  keyMoney?: number;
  startDate?: string;
  endDate?: string;
  specialTerms?: string;
  agentName?: string;
  agentLicense?: string;
}) {
  const prompt = `以下の情報をもとに${params.type === 'lease' ? '賃貸借契約書' : '売買契約書'}のドラフトを作成してください。

【物件情報】
物件名：${params.propertyName}
所在地：${params.propertyAddress}

【契約者情報】
借主/買主：${params.tenantName}

【契約条件】
${params.rent ? `月額賃料：${params.rent.toLocaleString()}円` : ''}
${params.deposit ? `敷金：${params.deposit.toLocaleString()}円` : ''}
${params.keyMoney ? `礼金：${params.keyMoney.toLocaleString()}円` : ''}
${params.startDate ? `契約開始：${params.startDate}` : ''}
${params.endDate ? `契約終了：${params.endDate}` : ''}
${params.specialTerms ? `特約事項：${params.specialTerms}` : ''}
${params.agentName ? `担当宅建士：${params.agentName}（${params.agentLicense}）` : ''}

第1条から第10条程度の本格的な契約書を作成してください。各条項は法的効力を持つ日本語で記載してください。`;

  return callAI({
    userId: params.userId,
    contractId: params.contractId,
    operation: 'generate',
    system: GENERATE_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 3000,
  });
}

// ─── AIリーガルチェック ────────────────────────────────────
const LEGAL_CHECK_SYSTEM = `あなたは不動産契約の法的リスク審査AIです。
提示された契約情報について、以下の観点からリスク・改善点を分析します：

1. 宅建業法（35条・37条書面要件）への準拠
2. 借地借家法への適合性
3. 消費者保護法・特定商取引法との整合
4. 国土交通省「原状回復ガイドライン」への準拠
5. 電子帳簿保存法の要件

必ずJSON形式で出力してください：
{
  "risk_level": "low" | "medium" | "high",
  "items": [
    {"type": "ok" | "warn" | "error", "category": "カテゴリ", "text": "説明文", "suggestion": "改善提案"}
  ],
  "summary": "総合評価コメント"
}

AIの判断はあくまで参考情報であり、最終的な法的確認は宅建士・弁護士が行うことを必ず注記してください。`;

export async function legalCheckContract(params: {
  userId: string;
  contractId?: string;
  type: string;
  contractData: Record<string, unknown>;
}) {
  const prompt = `以下の${params.type === 'lease' ? '賃貸借契約' : '売買契約'}についてリーガルチェックを実施してください：
${JSON.stringify(params.contractData, null, 2)}`;

  return callAI({
    userId: params.userId,
    contractId: params.contractId,
    operation: 'legal_check',
    system: LEGAL_CHECK_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
  });
}

// ─── 特約条項生成 ───────────────────────────────────────────
export async function generateSpecialTerms(params: {
  userId: string;
  conditions: string;
}) {
  return callAI({
    userId: params.userId,
    operation: 'special_terms',
    system: '不動産賃貸借契約の特約条項作成の専門家として、法的に有効な特約条項を日本語で生成してください。箇条書きで3〜5項目を提案してください。',
    messages: [{ role: 'user', content: `条件：${params.conditions}\n\nこの条件に基づいた特約条項を提案してください。` }],
    maxTokens: 800,
  });
}

// ─── トークン使用量統計取得 ───────────────────────────────
export async function getTokenStats(params: {
  userId?: string;
  period?: 'today' | 'week' | 'month' | 'all';
}) {
  const supabase = createAdminSupabase();
  const { period = 'month', userId } = params;

  const now = new Date();
  let since: Date;
  switch (period) {
    case 'today': since = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case 'week': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': since = new Date(now.getFullYear(), now.getMonth(), 1); break;
    default: since = new Date(0);
  }

  let query = supabase
    .from('ai_token_usage')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;

  // 集計
  const byOperation = (data ?? []).reduce((acc, row) => {
    if (!acc[row.operation]) acc[row.operation] = { tokens: 0, cost: 0, count: 0 };
    acc[row.operation].tokens += row.total_tokens;
    acc[row.operation].cost += Number(row.cost_usd);
    acc[row.operation].count += 1;
    return acc;
  }, {} as Record<string, { tokens: number; cost: number; count: number }>);

  const totalTokens = (data ?? []).reduce((s, r) => s + r.total_tokens, 0);
  const totalCost = (data ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);

  // 直近7日の日次推移
  const daily: Record<string, { tokens: number; cost: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    daily[key] = { tokens: 0, cost: 0 };
  }
  (data ?? []).forEach(row => {
    const key = row.created_at.split('T')[0];
    if (daily[key]) {
      daily[key].tokens += row.total_tokens;
      daily[key].cost += Number(row.cost_usd);
    }
  });

  return {
    totalTokens,
    totalCost,
    callCount: (data ?? []).length,
    byOperation,
    daily: Object.entries(daily).map(([date, v]) => ({ date, ...v })),
    recentCalls: (data ?? []).slice(0, 20),
  };
}

// ─── 月次予算チェック ─────────────────────────────────────
export async function checkMonthlyBudget(): Promise<{
  used: number; budget: number; percentage: number; alert: boolean;
}> {
  const supabase = createAdminSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: usage }, { data: settings }] = await Promise.all([
    supabase.from('ai_token_usage').select('cost_usd').gte('created_at', monthStart.toISOString()),
    supabase.from('system_settings').select('value').eq('key', 'monthly_ai_budget_usd').single(),
  ]);

  const used = (usage ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);
  const budget = parseFloat(settings?.value ?? '50');
  const percentage = Math.min((used / budget) * 100, 100);
  const alert = percentage >= 80;

  return { used, budget, percentage, alert };
}
