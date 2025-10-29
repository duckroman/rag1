import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return new NextResponse(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL is not set in .env.local');
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`n8n webhook failed with status ${n8nResponse.status}: ${errorText}`);
    }

    // Correctly handle different content types from n8n
    const contentType = n8nResponse.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // If n8n sends a stream, we pipe it directly to our client
      return new NextResponse(n8nResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } else if (contentType.includes('application/json')) {
      // If it's a simple JSON response
      const responseData = await n8nResponse.json();
      // We still stream it back for a consistent frontend experience
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(JSON.stringify(responseData));
          controller.close();
        },
      });
      return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    } else {
      // Handle plain text response
      const responseText = await n8nResponse.text();
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(responseText));
          controller.close();
        },
      });
      return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    }

  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: 'Failed to connect to chat workflow', details: error.message }), { status: 500 });
  }
}