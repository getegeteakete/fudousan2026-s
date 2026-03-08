import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminSupabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ properties: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminSupabase();
    const rows = Array.isArray(body) ? body : [body];
    const { data, error } = await supabase.from('properties').insert(rows).select();
    if (error) throw error;
    return NextResponse.json({ properties: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
