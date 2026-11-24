export const formatPhone = (phone: string): string => {
  if (!phone) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export const sanitizeNullableText = (value?: string | null): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.toLowerCase();
  if (normalized === "null" || normalized === "undefined") {
    return "";
  }

  return trimmed;
};

export const buildDisplayName = (
  parts: Array<string | null | undefined>,
  fallback = ""
): string => {
  const name = parts
    .map((part) => sanitizeNullableText(part))
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || fallback;
};

export const getOrFallback = (
  value?: string | null,
  fallback = "N/A"
): string => {
  const sanitized = sanitizeNullableText(value);
  return sanitized || fallback;
};

export const formatRichTextToPlain = (value?: string | null): string => {
  const sanitized = sanitizeNullableText(value);
  if (!sanitized) {
    return "";
  }

  const withLineBreaks = sanitized
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<\/\s*(div|p|li|h[1-6])\s*>/gi, "\n");

  const withoutTags = withLineBreaks.replace(/<[^>]*>/g, " ");

  const decodedEntities = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decodedEntities
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

