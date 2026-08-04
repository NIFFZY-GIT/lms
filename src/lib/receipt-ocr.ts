import 'server-only';

import path from 'path';
import { mkdir } from 'fs/promises';
import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';
import { PDFParse } from 'pdf-parse';

// Tesseract downloads a ~5MB language model on first use and, left to itself,
// writes it into the process working directory — i.e. the repo root. Keep it in
// a dedicated cache directory instead (gitignored).
const TESSERACT_CACHE = path.join(process.cwd(), '.tesseract-cache');

/**
 * Reads the bank reference number and paid amount off an uploaded receipt.
 *
 * Everything here produces *suggestions* for the admin review screen, never an
 * authority. Local OCR on a phone photo of a printed slip is unreliable, so a
 * miss must cost nothing: the admin types the value in exactly as before.
 * Digitally generated PDFs skip OCR entirely and read their embedded text,
 * which is exact.
 */

export type ScanSource = 'PDF_TEXT' | 'IMAGE_OCR';

export type ReceiptScan = {
  source: ScanSource;
  /** Full extracted text, kept so the admin can eyeball what was read. */
  text: string;
  referenceNumber: string | null;
  amount: number | null;
  /** Mean OCR confidence 0-100; null for PDF text, which is exact. */
  confidence: number | null;
};

function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

/**
 * Receipt photos are the hard case for Tesseract: small text, uneven lighting,
 * phone-camera noise. Upscaling, flattening contrast and sharpening before
 * recognition matters far more than any Tesseract parameter.
 */
async function preprocessForOcr(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer).rotate(); // honour EXIF, otherwise photos come in sideways
  const { width } = await image.metadata();

  let pipeline = image.greyscale().normalise();
  // Tesseract wants roughly 300 DPI; upscale anything smaller rather than
  // asking it to read 8px-tall digits.
  if (width && width < 1800) {
    pipeline = pipeline.resize({ width: 1800, withoutEnlargement: false });
  }

  return pipeline.sharpen().png().toBuffer();
}

// Letters Tesseract substitutes for digits inside an otherwise-numeric field.
// Measured on receipt scans: "784512396" comes back as "78U512396".
const DIGIT_FIXES: Record<string, string> = {
  O: '0', o: '0', D: '0', Q: '0',
  I: '1', i: '1', l: '1', L: '1', J: '1', '|': '1',
  Z: '2', z: '2',
  A: '4', U: '4', u: '4',
  S: '5', s: '5',
  G: '6', b: '6',
  T: '7',
  B: '8', E: '8',
  g: '9', q: '9',
};

function coerceDigits(token: string): string {
  return token
    .split('')
    .map((ch) => (/[0-9]/.test(ch) ? ch : (DIGIT_FIXES[ch] ?? ch)))
    .join('')
    .replace(/[^0-9]/g, '');
}

/**
 * Normalises a reference token.
 *
 * A *leading* alphabetic run is a real prefix banks use ("TX8845120") and is
 * preserved; letters appearing inside the digit run are OCR errors and get
 * coerced to their digit lookalikes.
 */
function normaliseReference(token: string): string {
  const cleaned = token.replace(/[^A-Za-z0-9]/g, '');
  const split = cleaned.match(/^([A-Za-z]*)(.*)$/);
  if (!split) return cleaned.toUpperCase();

  const [, prefix, rest] = split;
  const digits = coerceDigits(rest);
  return digits.length >= 4 ? `${prefix.toUpperCase()}${digits}` : cleaned.toUpperCase();
}

const REFERENCE_LABELS =
  /(?:reference|referance|refrence|ref(?:erence)?\s*(?:no|num|number|#)?|transaction\s*(?:id|no|number|ref)?|txn\s*(?:id|no)?|receipt\s*(?:no|number)|slip\s*(?:no|number)|journal\s*(?:no)?|trace\s*(?:no)?)/i;

/**
 * Prefers a number that sits next to a "Reference No." style label; falls back
 * to the longest standalone digit run, which is what most slips use.
 */
export function extractReferenceNumber(text: string): string | null {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const labelMatch = line.match(REFERENCE_LABELS);
    if (!labelMatch) continue;

    const after = line.slice(labelMatch.index! + labelMatch[0].length);
    // Allow letter-prefixed refs (e.g. "TX8845120"), then normalise OCR slips.
    const token = after.match(/[:\s.#-]*([A-Za-z0-9][A-Za-z0-9/-]{5,29})/);
    if (!token) continue;

    const normalised = normaliseReference(token[1]);
    if (normalised.length >= 6) return normalised;
  }

  // No label found. Suggesting the wrong number is worse than suggesting
  // nothing — the admin may accept it — so the fallback is deliberately strict:
  // at least 8 digits, and not a segment of a hyphenated identifier. A People's
  // Bank transfer slip carries no reference number at all, and a loose rule
  // happily returns "0590439" out of the account "103-2-002-6-0590439".
  const runs = text
    .split(/\r?\n/)
    .filter((line) => !NOT_AN_AMOUNT_LINE.test(line))
    .flatMap((line) => line.match(/(?<![\d\-/])\d{8,30}(?![\d\-/])/g) ?? []);

  if (!runs.length) return null;

  return runs.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}

const AMOUNT_LABELS = /(?:amount|total|paid|deposit|lkr|rs\.?)/i;

// Lines naming an account or reference hold long digit groups that are not
// money — "Credit Account 1023 4567 8901" otherwise reads as 23,456.
const NOT_AN_AMOUNT_LINE = /(?:account|a\/c|acc(?:ount)?\s*no|card|reference|ref\s*no)/i;

// The thousands comma is routinely misread — "2,500.00" comes back as
// "2 i 500.00" or "2 ’ 500.00" — so the separator tolerates a little noise.
// Requiring the ".00" ending is what keeps account numbers ("1023 4567 8901")
// from matching, since they never carry decimals.
const AMOUNT_PATTERN =
  /(\d{1,3}(?:[^\d\n]{1,3}\d{3})+\.\d{2}|\d{1,3}(?:,\d{3})+|\d+\.\d{2})/;

// The same shapes minus the bare decimal — used where there is no label to
// confirm the number is money.
const GROUPED_AMOUNT_PATTERN =
  /(\d{1,3}(?:[^\d\n]{1,3}\d{3})+\.\d{2}|\d{1,3}(?:,\d{3})+)/;

function parseAmount(raw: string): number | null {
  // Split the cents off first, then strip every separator from the rupee part —
  // whatever character OCR decided the thousands comma was.
  const withCents = raw.match(/^(.*?)\.(\d{2})$/);
  const rupees = (withCents ? withCents[1] : raw).replace(/\D/g, '');
  const cents = withCents ? withCents[2] : '00';
  if (!rupees) return null;

  const value = Number(`${rupees}.${cents}`);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Prefers an amount on a labelled line ("AMOUNT (LKR) 2,500.00"); otherwise
 * takes the largest currency-shaped number, which on a deposit slip is almost
 * always the amount paid.
 */
export function extractAmount(text: string): number | null {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (NOT_AN_AMOUNT_LINE.test(line)) continue;
    if (!AMOUNT_LABELS.test(line)) continue;
    const match = line.match(AMOUNT_PATTERN);
    if (!match) continue;
    const value = parseAmount(match[1]);
    if (value !== null) return value;
  }

  // Unlabelled fallback accepts *grouped* numbers only ("2,500.00"), never a
  // bare decimal. A plain "12.00" is far more likely to be a class time or a
  // date than an amount, and a wrong pre-filled figure is worse than a blank.
  const candidates = lines
    .filter((line) => !NOT_AN_AMOUNT_LINE.test(line))
    .flatMap((line) => line.match(new RegExp(GROUPED_AMOUNT_PATTERN, 'g')) ?? [])
    .map(parseAmount)
    .filter((value): value is number => value !== null);

  return candidates.length ? Math.max(...candidates) : null;
}

async function readPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy();
  }
}

async function runOcr(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  // cachePath is only honoured if the directory already exists — otherwise the
  // write fails silently and the 5MB model is re-downloaded on every single scan.
  await mkdir(TESSERACT_CACHE, { recursive: true }).catch(() => {});

  const worker = await createWorker('eng', undefined, { cachePath: TESSERACT_CACHE });
  try {
    // Receipts read as a single column of variable-size lines, which is what
    // SINGLE_COLUMN is for; AUTO tends to fragment the label/value pairs.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN });
    const { data } = await worker.recognize(buffer);
    return { text: data.text ?? '', confidence: data.confidence ?? 0 };
  } finally {
    await worker.terminate();
  }
}

/** Never throws — a failed scan just means the admin fills the fields in manually. */
export async function scanReceipt(buffer: Buffer): Promise<ReceiptScan | null> {
  try {
    if (isPdf(buffer)) {
      const text = await readPdfText(buffer);
      return {
        source: 'PDF_TEXT',
        text,
        referenceNumber: extractReferenceNumber(text),
        amount: extractAmount(text),
        confidence: null,
      };
    }

    const prepared = await preprocessForOcr(buffer);
    const { text, confidence } = await runOcr(prepared);

    return {
      source: 'IMAGE_OCR',
      text,
      referenceNumber: extractReferenceNumber(text),
      amount: extractAmount(text),
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error('[scanReceipt] Failed to read receipt:', error);
    return null;
  }
}
