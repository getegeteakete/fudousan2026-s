import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getAuthUser } from '@/lib/supabase-server';

const SYSTEM_PROMPT = `あなたは不動産会社のAIアシスタント「PropSign AI」です。
宅地建物取引業法・電子帳簿保存法・電子署名法の専門知識を持ち、不動産の賃貸借契約・売買契約・媒介契約・管理委託契約のすべてに精通しています。

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
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { messages, contractId } = await req.json();

    const result = await callAI({
      userId: user.id,
      contractId,
      operation: 'chat',
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 600,
    });

    return NextResponse.json({
      text: result.text,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        costUsd: result.costUsd,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
