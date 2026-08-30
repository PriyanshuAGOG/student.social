const LETTER_PATTERN = /\p{L}/u
const ONLY_NUMBERS_AND_SYMBOLS_PATTERN = /^[\p{N}\p{P}\p{S}\s]+$/u

export function normalizeHumanText(value: unknown, maxLength = 255): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function isHumanReadableText(value: unknown, minimumLength = 2): boolean {
  const text = normalizeHumanText(value)
  return text.length >= minimumLength && LETTER_PATTERN.test(text) && !ONLY_NUMBERS_AND_SYMBOLS_PATTERN.test(text)
}

export function humanTextError(label: string, value: unknown, minimumLength = 2): string | null {
  const text = normalizeHumanText(value)
  if (text.length < minimumLength) return `${label} must be at least ${minimumLength} characters.`
  if (!LETTER_PATTERN.test(text) || ONLY_NUMBERS_AND_SYMBOLS_PATTERN.test(text)) {
    return `${label} must include a descriptive word, not only numbers or symbols.`
  }
  return null
}
