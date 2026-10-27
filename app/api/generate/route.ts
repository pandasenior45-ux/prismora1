import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

const ASPECTS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:5': { width: 896, height: 1120 },
  '3:4': { width: 864, height: 1152 },
  '9:16': { width: 720, height: 1280 },
  '4:3': { width: 1152, height: 864 },
  '16:9': { width: 1280, height: 720 },
  '3:2': { width: 1152, height: 768 },
  '2:3': { width: 768, height: 1152 },
};

const STYLE_GUIDANCE: Record<string, string> = {
  'Photorealistic': 'Photorealistic photography, natural physically accurate lighting, refined composition, lifelike materials and authentic details.',
  'Cinematic': 'Cinematic film still, intentional camera language, rich atmospheric lighting, beautiful color grading and dramatic composition.',
  '3D Render': 'Premium 3D artwork, beautifully modeled forms, realistic materials, refined global illumination and polished rendering.',
  'Anime': 'High-quality Japanese-inspired anime illustration, expressive shapes, clean linework, carefully painted lighting and rich backgrounds.',
  'Digital Art': 'Polished professional digital illustration, sophisticated rendering, crisp details and a compelling visual hierarchy.',
  'Watercolor': 'Traditional watercolor painting, translucent pigment layers, delicate paper texture, expressive brushwork and soft color blooms.',
  'Oil Painting': 'Museum-quality oil painting, layered brushstrokes, rich pigment, tactile canvas texture and painterly depth.',
  'Minimalist': 'Minimalist visual design, restrained palette, intentional negative space, elegant geometry and exceptionally clear composition.',
  'Fantasy': 'Imaginative high-fantasy concept art, magical atmosphere, intricate worldbuilding details and luminous environmental storytelling.',
  'Cyberpunk': 'Cyberpunk visual aesthetic, atmospheric urban details, bold contrast, reflective surfaces and controlled futuristic lighting.',
  'Vintage Film': 'Analog 35mm film photograph, organic film grain, gentle halation, nostalgic color response and authentic imperfections.',
  'Editorial': 'Premium art-direction for a contemporary magazine, refined styling, confident composition and sophisticated visual storytelling.',
  'Isometric': 'Precise isometric illustration, consistent perspective, clean forms, detailed miniature environment and balanced geometry.',
  'Pixel Art': 'High-quality intentional pixel art, crisp pixel clusters, limited harmonious palette and carefully designed game-art composition.',
  'Surrealism': 'Dreamlike surrealist artwork, unexpected but coherent visual juxtapositions, symbolic details and imaginative atmosphere.',
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    return jsonError(
      'Cloudflare setup is incomplete. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel Environment Variables, then redeploy.',
      503,
    );
  }

  let body: { prompt?: unknown; style?: unknown; aspectRatio?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonError('The request body must be a JSON object.', 400);
    }
    body = parsed as { prompt?: unknown; style?: unknown; aspectRatio?: unknown };
  } catch {
    return jsonError('The request body must be valid JSON.', 400);
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const style = typeof body.style === 'string' ? body.style : 'Photorealistic';
  const aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio : '1:1';

  if (!prompt) return jsonError('Please enter an image prompt first.', 400);
  if (prompt.length > 1800) return jsonError('Your prompt is too long. Please keep it under 1,800 characters.', 400);
  if (!Object.prototype.hasOwnProperty.call(STYLE_GUIDANCE, style)) return jsonError('Please choose one of the available image styles.', 400);
  if (!Object.prototype.hasOwnProperty.call(ASPECTS, aspectRatio)) return jsonError('Please choose a supported aspect ratio.', 400);

  const { width, height } = ASPECTS[aspectRatio];
  const finalPrompt = `${prompt}\n\nVisual style: ${STYLE_GUIDANCE[style]}\n\nQuality direction: exceptional composition, clear subject, intentional lighting, coherent details, professional finish.`;

  const form = new FormData();
  form.set('prompt', finalPrompt);
  form.set('width', String(width));
  form.set('height', String(height));
  form.set('guidance', '3.5');
  form.set('seed', String(Math.floor(Math.random() * 2_000_000_000)));

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    });

    const raw = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const data = payload as { errors?: Array<{ message?: string }>; messages?: Array<{ message?: string }> } | null;
      const detail = data?.errors?.map((item) => item.message).filter(Boolean).join(' ') ||
        data?.messages?.map((item) => item.message).filter(Boolean).join(' ') ||
        `Cloudflare returned HTTP ${response.status}.`;
      return jsonError(`Image generation failed: ${detail}`, response.status >= 500 ? 502 : response.status);
    }

    const data = payload as { success?: boolean; result?: { image?: string }; errors?: Array<{ message?: string }> } | null;
    const base64 = data?.result?.image;
    if (data?.success === false) {
      const detail = data.errors?.map((item) => item.message).filter(Boolean).join(' ');
      return jsonError(detail || 'Cloudflare could not generate this image. Check your model access and try again.', 502);
    }
    if (!base64 || typeof base64 !== 'string') {
      return jsonError('Cloudflare responded, but no image was included. Check your Workers AI model access and try again.', 502);
    }

    const mimeType = base64.startsWith('iVBOR') ? 'image/png' : base64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
    return NextResponse.json({
      image: base64,
      mimeType,
      width,
      height,
      aspectRatio,
      style,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error.';
    if (message.toLowerCase().includes('timeout')) {
      return jsonError('The image model took too long to respond. Please try again with a shorter prompt.', 504);
    }
    return jsonError('Could not reach Cloudflare Workers AI. Check your connection and Cloudflare service status, then try again.', 502);
  }
}
