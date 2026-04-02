/**
 * Netlify serverless function: evaluates how well a job matches the CV.
 *
 * Route:   POST /api/match
 * Headers: x-app-secret (must match APP_SECRET env variable)
 * Body:    { title, company, description }
 * Returns: { score: number, reasoning: string }
 *
 * Required Netlify environment variables:
 *   ANTHROPIC_API_KEY  — Claude API key
 *   APP_SECRET         — shared password checked against the request header
 *   CV_TEXT            — anonymized CV as plain text
 */
import { MODEL, MATCH_CONFIG, matchPrompt } from './config.js';

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export default async (req, context) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = req.headers.get('x-app-secret');
  if (!secret || secret !== process.env.APP_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: HEADERS });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: HEADERS });
  }

  const { title, company, description } = body;
  if (!description) {
    return new Response(JSON.stringify({ error: 'Missing description' }), { status: 400, headers: HEADERS });
  }

  const cv = process.env.CV_TEXT || '';
  const prompt = matchPrompt({ title, company, description, cv });

  // ── Call Claude ───────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MATCH_CONFIG.max_tokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: 'Claude API error', detail: err.slice(0, 300) }), { status: 502, headers: HEADERS });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Extract JSON from Claude's response — guard against any surrounding prose
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Claude response');
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to process Claude response', message: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
};

export const config = { path: '/api/match' };
