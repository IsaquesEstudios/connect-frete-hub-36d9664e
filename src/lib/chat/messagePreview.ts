export function isImageBody(body: string) {
  return body.startsWith("data:image/");
}

export function isAudioBody(body: string) {
  return body.startsWith("data:audio/");
}

/** Texto curto para preview em lista de conversas. */
export function messagePreview(body: string): string {
  if (isImageBody(body)) return "📷 Imagem";
  if (isAudioBody(body)) return "🎵 Áudio";
  return body;
}
