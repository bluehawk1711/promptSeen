import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { keys } = (await req.json()) as { keys?: string[] };

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'keys array is required' }, { status: 400 });
    }

    await invalidateCache(...keys);

    return NextResponse.json({ ok: true, invalidated: keys });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cache invalidation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
