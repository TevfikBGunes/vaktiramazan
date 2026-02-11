import { google } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';

const menuSchema = z.object({
  soup: z.string().describe('Çorba adı'),
  soupIngredients: z.string().describe('Çorba malzemeleri listesi'),
  soupInstructions: z.string().describe('Çorba yapılışı tarifi'),
  main: z.string().describe('Ana yemek adı'),
  mainIngredients: z.string().describe('Ana yemek malzemeleri listesi'),
  mainInstructions: z.string().describe('Ana yemek yapılışı tarifi'),
  side: z.string().describe('Yan yemek veya meze adı'),
  sideIngredients: z.string().describe('Yan yemek/meze malzemeleri listesi'),
  sideInstructions: z.string().describe('Yan yemek/meze yapılışı tarifi'),
  dessert: z.string().describe('Tatlı adı'),
  dessertIngredients: z.string().describe('Tatlı malzemeleri listesi'),
  dessertInstructions: z.string().describe('Tatlı yapılışı tarifi'),
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
    'Sen Türk mutfağı konusunda uzman bir şefsin. Şu malzemelere göre iftar için uygun, pratik ve lezzetli bir menü öner. Her yemek için adını, malzemelerini ve yapılış tarifini ayrı ayrı, Türkçe olarak yaz.';
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
