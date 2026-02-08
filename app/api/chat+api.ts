import { google } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

const menuSchema = z.object({
  soup: z.string().describe('Çorba adı ve kısa açıklama'),
  main: z.string().describe('Ana yemek adı ve tarifi'),
  side: z.string().describe('Yan yemek veya meze'),
  dessert: z.string().describe('Tatlı adı'),
  recipe: z.string().describe('Genel notlar veya pişirme tavsiyeleri'),
});

export async function POST(req: Request) {
  let body: { prompt?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const promptText =
    typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!promptText) {
    return new Response(
      JSON.stringify({ error: 'Missing or empty "prompt" in body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt =
    'Sen Türk mutfağı konusunda uzman bir şefsin. Şu malzemelere göre iftar için uygun, pratik ve lezzetli bir menü öner. Her alan için Türkçe açıklamalar yaz.';
  const result = streamObject({
    model: google('gemini-2.0-flash-lite'),
    schema: menuSchema,
    system: systemPrompt,
    messages: [
      { role: 'user' as const, content: promptText },
    ],
  });

  return result.toTextStreamResponse();
}
