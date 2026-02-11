import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const menuSchema = z.object({
  soup: z.string().describe('Çorba adı (sadece isim, açıklama yok)'),
  soupCal: z.number().describe('Çorbanın tahmini kalorisi (kcal)'),
  main: z.string().describe('Ana yemek adı (sadece isim)'),
  mainCal: z.number().describe('Ana yemeğin tahmini kalorisi (kcal)'),
  side: z.string().describe('Yan yemek veya meze adı (sadece isim)'),
  sideCal: z.number().describe('Yan yemek/mezenin tahmini kalorisi (kcal)'),
  dessert: z.string().describe('Tatlı adı (sadece isim)'),
  dessertCal: z.number().describe('Tatlının tahmini kalorisi (kcal)'),
  totalCal: z.number().describe('Toplam tahmini kalori (kcal)'),
});

const RANDOM_MENU_SYSTEM =
  'Sen Türk mutfağı konusunda uzman bir diyetisyen-şefsin. Rastgele bir iftar menüsü üret. Her seferinde farklı ve çeşitli, klasik Türk iftar sofrasına uygun olsun. Her alan için SADECE yemek ismini yaz, tarif veya açıklama ekleme. Ayrıca her kategori için tahmini kalori (kcal, bir porsiyon) ve menünün toplam kalorisini hesapla.';

export async function POST(req: Request) {
  let exclude: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.exclude)) {
      exclude = body.exclude.filter((s: unknown) => typeof s === 'string');
    }
  } catch {
    // No body or invalid JSON – proceed without exclusions
  }

  const excludeClause =
    exclude.length > 0
      ? `\n\nAşağıdaki yemekleri KESİNLİKLE kullanma, hepsinden tamamen farklı yemekler seç:\n${exclude.map((e) => `- ${e}`).join('\n')}`
      : '';

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      schema: menuSchema,
      system: RANDOM_MENU_SYSTEM + excludeClause,
      prompt: 'Rastgele bir iftar menüsü üret. Sadece yemek isimlerini ve kalorileri ver. Daha önce önerdiğin yemeklerden tamamen farklı olsun.',
      temperature: 1.2,
    });

    return Response.json(object);
  } catch (err) {
    console.error('Random menu API error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Menü oluşturulamadı' },
      { status: 500 }
    );
  }
}
