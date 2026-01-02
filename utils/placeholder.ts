export function placeholder(width: number, height: number, text?: string): string {
  const query = text ? `&text=${encodeURIComponent(text)}` : ""
  return `/placeholder.svg?height=${height}&width=${width}${query}`
}
