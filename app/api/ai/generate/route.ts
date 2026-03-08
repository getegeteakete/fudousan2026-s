import { NextRequest, NextResponse } from 'next/server';
import { generateContractText } from '@/lib/ai';
import { getAuthUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const body = await req.json();
    const result = await generateContractText({ userId: user.id, ...body });

    return NextResponse.json({
      text: result.text,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        costUsd: result.costUsd,
        responseMs: result.responseMs,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
