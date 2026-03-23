import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = 'studiohaetae2026';

// Meta Webhook 인증 (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Webhook 이벤트 수신 (POST)
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('[Instagram Webhook]', JSON.stringify(body));
  return NextResponse.json({ received: true }, { status: 200 });
}
