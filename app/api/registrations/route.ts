import { NextResponse } from 'next/server';

// Placeholder route to avoid empty module build error.
// Replace with real logic or remove this file if not needed.
export async function POST(req: Request) {
	return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function GET() {
	return NextResponse.json({ status: 'ok' });
}

export function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		}
	});
}
