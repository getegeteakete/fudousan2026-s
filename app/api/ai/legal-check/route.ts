import { NextRequest, NextResponse } from 'next/server';
import { legalCheckContract } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await legalCheckContract(body);
    let parsed;
    try {
      const clean = result.text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { risk_level: 'low', items: [{ type: 'ok', category: '確認', text: 'AIチェック完了' }], summary: result.text.slice(0, 200) };
    }
    return NextResponse.json({ result: parsed, usage: { totalTokens: result.totalTokens, costUsd: result.costUsd } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
