import { NextRequest, NextResponse } from 'next/server';
import { generateContractText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await generateContractText(body);
    return NextResponse.json({
      text: result.text,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, totalTokens: result.totalTokens, costUsd: result.costUsd },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
