// Otimização de mídia no cliente — reduz o tamanho dos arquivos antes de
// persistir no banco, preservando ao máximo a qualidade percebida.

export interface ImageOptimizeOptions {
  maxDimension?: number; // maior lado em px
  quality?: number; // 0..1
  targetBytes?: number; // reduz qualidade até chegar próximo
  mimeType?: "image/jpeg" | "image/webp";
}

/**
 * Reduz uma imagem para caber em `targetBytes` mantendo a maior qualidade
 * possível. Redimensiona pelo maior lado e reduz qualidade progressivamente.
 */
export async function optimizeImage(
  file: File | Blob,
  opts: ImageOptimizeOptions = {},
): Promise<Blob> {
  const maxDimension = opts.maxDimension ?? 1600;
  const targetBytes = opts.targetBytes ?? 400_000; // ~400KB
  const mimeType = opts.mimeType ?? "image/jpeg";

  const bitmap = await createBitmap(file);
  const { width, height } = fitInside(bitmap.width, bitmap.height, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
    (bitmap as ImageBitmap).close();
  }

  let quality = opts.quality ?? 0.82;
  let blob = await canvasToBlob(canvas, mimeType, quality);

  // Se ainda estiver acima do alvo, cai de qualidade em passos.
  while (blob.size > targetBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }
  // Última tentativa: reduzir dimensão pela metade.
  if (blob.size > targetBytes && Math.max(width, height) > 800) {
    const c2 = document.createElement("canvas");
    c2.width = Math.round(width * 0.75);
    c2.height = Math.round(height * 0.75);
    const cx = c2.getContext("2d");
    if (cx) {
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(canvas, 0, 0, c2.width, c2.height);
      blob = await canvasToBlob(c2, mimeType, 0.75);
    }
  }
  return blob;
}

export async function optimizeImageToDataUrl(
  file: File | Blob,
  opts?: ImageOptimizeOptions,
): Promise<string> {
  const blob = await optimizeImage(file, opts);
  return blobToDataUrl(blob);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function createBitmap(file: File | Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fallback abaixo */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // Revoga depois que a imagem já foi desenhada em canvas pelo caller.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function fitInside(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const r = w > h ? max / w : max / h;
  return { width: Math.round(w * r), height: Math.round(h * r) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
      type,
      quality,
    );
  });
}
