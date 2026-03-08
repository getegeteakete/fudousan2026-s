import { NextRequest, NextResponse } from 'next/server';

const SYSTEM = `あなたは不動産会社のAIアシスタント「PropSign AI」です。
宅地建物取引業法・電子帳簿保存法・電子署名法の専門知識を持ち、不動産の賃貸借・売買・媒介・管理委託契約に精通しています。

役割：
- 契約書の作成を手順ごとにガイドする
- 重要事項説明書の確認ポイントを提示する
- 特約条項の草案を提案する（最終確認は宅建士に委ねる旨を明示）
- 法的リスクを分かりやすく説明する
- 契約金（敷金・礼金・仲介手数料）の計算を補助する
- 電子署名・電子契約の流れを案内する

応答スタイル：
- 簡潔かつ丁寧に（300字以内を目安）
- 手順は番号付きリストで示す
- 重要な注意は「⚠️」、完了事項は「✅」マーク
- 法的判断の最終確認は必ず「宅建士にご確認ください」と明示

現在のシステム：PropSign 不動産電子契約システム`;

export async function POST(req: NextRequest) {
  try {
    const { messages, contractId } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-ant')) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が未設定です。Vercel環境変数を確認してください。' }, { status: 503 });
    }

    const start = Date.now();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: SYSTEM,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Anthropic API エラー: ${res.status} ${err.slice(0,200)}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    const inputTokens: number = data.usage?.input_tokens ?? 0;
    const outputTokens: number = data.usage?.output_tokens ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const costUsd = (inputTokens / 1_000_000 * 3) + (outputTokens / 1_000_000 * 15);
    const responseMs = Date.now() - start;

    // トークン記録（Supabase未設定でも失敗しないように）
    try {
      const { createAdminSupabase } = await import('@/lib/supabase-server');
      const supabase = createAdminSupabase();
      await supabase.from('ai_token_usage').insert({
        user_id: null,
        contract_id: contractId ?? null,
        operation: 'chat',
        model: 'claude-sonnet-4-20250514',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_ms: responseMs,
        metadata: { messages_count: messages.length },
      });
    } catch { /* Supabase未設定時はサイレントに無視 */ }

    return NextResponse.json({
      text,
      usage: { inputTokens, outputTokens, totalTokens, costUsd },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
