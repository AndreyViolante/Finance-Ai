import {RawNotificationPayload, CardExpense} from '../types';

// ─── Cartões monitorados ──────────────────────────────────────────────────────

/**
 * Apenas notificações do Santander que mencionem um desses finais de cartão
 * serão capturadas. Outros bancos não têm restrição de cartão.
 */
const SANTANDER_PACKAGE = 'br.com.santander.benfico';

const ALLOWED_SANTANDER_CARDS = [];

// ─── Regex Patterns ───────────────────────────────────────────────────────────

const AMOUNT_REGEX =
  /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d{2})?|\d+(?:,\d{2})?)/i;

const MERCHANT_PATTERNS: RegExp[] = [
  /(?:compra\s+(?:aprovada\s+)?(?:em|no|na|de))\s+([A-Z0-9 *.\-&']{3,40})(?:\s+(?:de\s+)?R\$|\.|\n|$)/i,
  /(?:pagamento\s+(?:para|a))\s+([A-Z0-9 *.\-&']{3,40})(?:\s+R\$|\.|\n|$)/i,
  /(?:debitado\s+em)\s+([A-Z0-9 *.\-&']{3,40})(?:\s+R\$|\.|\n|$)/i,
  /^([A-Z][A-Z0-9 *]{2,30})\s*[-–]\s*R\$/i,
  /([A-Za-zÀ-ÿ0-9 *.\-&']{3,40})\s+R\$/i,
];

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseNotification(
  payload: RawNotificationPayload,
): CardExpense | null {
  const combined = `${payload.title} ${payload.text}`.trim();

  // Filtro Santander: só captura se mencionar um dos cartões permitidos
  if (payload.packageName === SANTANDER_PACKAGE) {
    const mentionsAllowedCard = ALLOWED_SANTANDER_CARDS.some(card =>
      combined.includes(card),
    );
    if (!mentionsAllowedCard) return null;
  }

  const amount = extractAmount(combined);
  if (!amount) return null;

  const merchant = extractMerchant(combined) ?? payload.appName;

  const now = payload.timestamp || Date.now();
  const date = new Date(now);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  // Detecta qual cartão foi usado (Santander)
  const detectedCard = ALLOWED_SANTANDER_CARDS.find(c => combined.includes(c));

  return {
    id:          `${now}-${Math.random().toString(36).slice(2, 7)}`,
    amount,
    merchant:    normalizeMerchant(merchant),
    rawText:     combined,
    appName:     detectedCard ? `${payload.appName} •••• ${detectedCard}` : payload.appName,
    packageName: payload.packageName,
    timestamp:   now,
    monthKey,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAmount(text: string): number | null {
  const match = AMOUNT_REGEX.exec(text);
  if (!match) return null;

  let raw = match[1];
  if (raw.includes(',')) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  }

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
