/**
 * Central configuration for all LLM-powered Netlify functions.
 * Edit this file to tune model choice, output length, language, and prompts
 * without touching the function logic.
 */

// ── Model ─────────────────────────────────────────────────────────────────────
// Haiku is cheap and fast — sufficient for structured short outputs.
// Swap to 'claude-sonnet-4-6' for higher quality at higher cost.
export const MODEL = 'claude-haiku-4-5-20251001';

// ── Match config ──────────────────────────────────────────────────────────────
export const MATCH_CONFIG = {
  max_tokens: 300,
  reasoning_sentences: 5,  // injected into the prompt as an instruction
  language: 'Deutsch',
};

// ── Cover letter config ───────────────────────────────────────────────────────
export const COVERLETTER_CONFIG = {
  max_tokens: 800,
  language: 'Deutsch',
  tone: 'professionell aber persönlich',
};

// ── Prompt templates ──────────────────────────────────────────────────────────
// Each is a function that takes a context object and returns a prompt string.
// Keeping prompts here makes them easy to iterate on without touching logic.

/**
 * Prompt for the match scoring feature ("Passt es zu mir?").
 * @param {object} ctx
 * @param {string} ctx.title       - Job title
 * @param {string} ctx.company     - Company name
 * @param {string} ctx.description - Full job description text
 * @param {string} ctx.cv          - Anonymized CV text
 * @returns {string} prompt
 */
export function matchPrompt({ title, company, description, cv }) {
  return `You are a career advisor. Evaluate how well the candidate profile matches the job offer.

## Candidate profile
${cv}

## Job offer
Title: ${title || 'N/A'}
Company: ${company || 'N/A'}
Description:
${description}

## Task
Return ONLY a valid JSON object with exactly these two fields:
- "score": an integer from 0 to 100 representing the match quality
- "reasoning": exactly ${MATCH_CONFIG.reasoning_sentences} sentences in ${MATCH_CONFIG.language} explaining the main strengths and weaknesses of the match

Example output format (do not copy the content, only the structure):
{"score": 72, "reasoning": "Die Kandidatin bringt solide Erfahrung in der Projektleitung mit. Kenntnisse im Bereich Offshore-Wind fehlen jedoch. Die geforderte PMP-Zertifizierung ist nicht vorhanden."}

JSON output:`;
}

/**
 * Prompt for the cover letter feature ("Motivationsschreiben").
 * @param {object} ctx
 * @param {string} ctx.title       - Job title
 * @param {string} ctx.company     - Company name
 * @param {string} ctx.description - Full job description text
 * @param {string} ctx.cv          - Anonymized CV text
 * @returns {string} prompt
 */
export function coverLetterPrompt({ title, company, description, cv }) {
  return `You are a career advisor. Write a cover letter for the following job application.

## Candidate profile
${cv}

## Job offer
Title: ${title || 'N/A'}
Company: ${company || 'N/A'}
Description:
${description}

## Task
Write a cover letter in ${COVERLETTER_CONFIG.language} with a ${COVERLETTER_CONFIG.tone} tone.
- Address it to the company without using a specific person's name (use "Sehr geehrte Damen und Herren")
- Leave placeholders like [Vorname Nachname] and [Datum] where personal details would go
- Keep it to 3-4 paragraphs: motivation, relevant experience, fit for the role, closing
- Do NOT invent facts not present in the CV
- Return only the letter text, no commentary

Cover letter:`;
}
