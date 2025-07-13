// Removes all HTML tags and replaces HTML entities with spaces from a string, returning clean plain text.
export function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Truncation of text
export function truncateContent(content: string, maxLength?: number): string {
  const plainText = extractPlainText(content);
  if (plainText.length <= maxLength!) return plainText;
  return plainText.substring(0, maxLength) + "...";
}

// Helper function to extract all images from HTML content
export function extractAllImages(html: string): string[] {
  const imgMatches = html.match(/<img[^>]+src="([^"]+)"/g);
  if (!imgMatches) return [];

  return imgMatches
    .map((match) => {
      const srcMatch = match.match(/src="([^"]+)"/);
      return srcMatch ? srcMatch[1] : "";
    })
    .filter(Boolean);
}
