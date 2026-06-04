export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s#@_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinWithin(a: string, b: string, maxDistance: number): boolean {
  if (Math.abs(a.length - b.length) > maxDistance) return false
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let rowMin = current[0]

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const next = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      )
      current[j] = next
      rowMin = Math.min(rowMin, next)
    }

    if (rowMin > maxDistance) return false
    previous.splice(0, previous.length, ...current)
  }

  return previous[b.length] <= maxDistance
}

export function fuzzyIncludes(haystack: string, query: string): boolean {
  const normalizedHaystack = normalizeSearchText(haystack)
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) return true
  if (normalizedHaystack.includes(normalizedQuery)) return true

  const terms = normalizedQuery.split(' ').filter(Boolean)
  const words = normalizedHaystack.split(' ').filter(Boolean)

  return terms.every((term) => {
    const maxDistance = term.length <= 4 ? 1 : 2
    return words.some((word) => word.startsWith(term) || levenshteinWithin(word, term, maxDistance))
  })
}

export function buildSearchSuggestions(items: string[], query: string, limit = 5): string[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const seen = new Set<string>()
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return fuzzyIncludes(item, normalizedQuery)
    })
    .slice(0, limit)
}
