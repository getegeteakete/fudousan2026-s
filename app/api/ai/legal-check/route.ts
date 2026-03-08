import { NextRequest, NextResponse } from 'next/server';
import { legalCheckContract } from '@/lib/ai';
import { getAuthUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const body = await req.json();
    const result = await legalCheckContract({ userId: user.id, ...body });

    // JSONパース試行
    let parsed;
    try {
      const clean = result.text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        risk_level: 'low',
        items: [{ type: 'ok', category: '確認', text: result.text, suggestion: '' }],
        summary: '分析完了',
      };
    }

    return NextResponse.json({
      result: parsed,
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
