import { NextRequest, NextResponse } from 'next/server';
import { getTokenStats, checkMonthlyBudget } from '@/lib/ai';
import { getAuthUser, getProfile } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const profile = await getProfile(user.id) as { role?: string } | null;
    const isAdmin = profile?.role === 'admin';

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') ?? 'month') as 'today' | 'week' | 'month' | 'all';

    // admin は全ユーザー、それ以外は自分のみ
    const [stats, budget] = await Promise.all([
      getTokenStats({ userId: isAdmin ? undefined : user.id, period }),
      checkMonthlyBudget(),
    ]);

    return NextResponse.json({ stats, budget });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
