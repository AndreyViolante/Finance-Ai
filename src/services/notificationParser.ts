import {RawNotificationPayload, CardExpense} from '../types';

// ─── Regex Patterns ───────────────────────────────────────────────────────────

/**
 * Captures R$ values in formats:
 *   R$ 1.234,56 / R$1234,56 / R$ 12,50 / R$12.50 / R$ 1.500,00
 */
const AMOUNT_REGEX =
  /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?|\d+(?:,\d{2})?)/i;

/**
 * Extracts merchant name from common notification patterns:
 *   "Compra aprovada em AMAZON"
 *   "Compra no POSTO IPIRANGA de R$"
 *   "IFOOD*RESTAURANTE - R$"
 *   "Pagamento para UBER"
 */
const MERCHANT_PATTERNS: RegExp[] = [
  /(?:compra\s+(?:aprovada\s+)?(?:em|no|na|de))\s+([A-Z0-9 *.\-&']{3,40})(?:\s+(?:de\s+)?R\$|\.|\n|$)/i,
  /(?:pagamento\s+(?:para|a))\s+([A-Z0-9 *.\-&']{3,40})(?:\s+R\$|\.|\n|$)/i,
  /(?:debitado\s+em)\s+([A-Z0-9 *.\-&']{3,40})(?:\s+R\$|\.|\n|$)/i,
  // Fallback: MERCHANT*REFERENCE pattern (Nubank style)
  /^([A-Z][A-Z0-9 *]{2,30})\s*[-–]\s*R\$/i,
  // Last resort: word before R$ amount
  /([A-Za-zÀ-ÿ0-9 *.\-&']{3,40})\s+R\$/i,
];

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseNotification(
  payload: RawNotificationPayload,
): CardExpense | null {
  const combined = `${payload.title} ${payload.text}`.trim();

  const amount = extractAmount(combined);
  if (!amount) return null;

  const merchant = extractMerchant(combined) ?? payload.appName;

  const now = payload.timestamp || Date.now();
  const date = new Date(now);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  return {
    id:          `${now}-${Math.random().toString(36).slice(2, 7)}`,
    amount,
    merchant:    normalizeMerchant(merchant),
    rawText:     combined,
    appName:     payload.appName,
    packageName: payload.packageName,
    timestamp:   now,
    monthKey,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAmount(text: string): number | null {
  const match = AMOUNT_REGEX.exec(text);
  if (!match) return null;

  // Normalize: "1.234,56" → 1234.56 | "1234,56" → 1234.56 | "12.50" → 12.50
  let raw = match[1];

  if (raw.includes(',')) {
    // Brazilian format: dots as thousands sep, comma as decimal sep
    raw = raw.replace(/\./g, '').replace(',', '.');
  }
  // If only dots present (no comma), treat last dot as decimal if 2 decimals
  // e.g. "12.50" stays "12.50"

  const value = parseFloat(raw);
  return isNaN(value) || value <= 0 ? null : value;
}

function extractMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function normalizeMerchant(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[*]+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 40);
}
