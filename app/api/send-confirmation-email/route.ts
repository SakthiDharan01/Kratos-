import { NextRequest, NextResponse } from 'next/server';

// Ensure this route runs in the Node.js runtime (required for nodemailer)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Lightweight wrapper that reuses the core service (single source of truth)
export async function POST(request: NextRequest) {
  try {
    const { registrantId, paymentId } = await request.json();
    if (!registrantId) {
      return NextResponse.json({ error: 'Registrant ID is required' }, { status: 400 });
    }
    const { sendConfirmationEmail } = await import('./email-service');
    const result = await sendConfirmationEmail(Number(registrantId), paymentId);
  // Avoid duplicate success key if service already returns success
  const { success, ...rest } = (result as any);
  return NextResponse.json({ success: success !== undefined ? success : true, ...rest });
  } catch (err) {
    console.error('send-confirmation-email route error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
