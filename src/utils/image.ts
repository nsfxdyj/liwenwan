// 图片工具：浏览器端 MIME 校验 + canvas 压缩，输出 dataURL（暂存，待发布时提交到仓库）

export const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export interface CompressResult {
  dataUrl: string;
  mime: string;
  size: number; // 压缩后字节数（近似）
}

function dataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}

// maxBytes：普通图 ≤300KB，壁纸 ≤800KB
export async function compressImage(file: File, maxBytes: number): Promise<CompressResult> {
  if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
    throw new Error('仅支持 jpg / png / webp 格式的图片');
  }
  const src = await readAsDataUrl(file);
  const img = await loadImage(src);

  // 透明图保 webp，否则 jpg；逐步降质量/缩放直到满足大小
  const hasAlpha = file.type === 'png' || file.type === 'webp';
  const mime = hasAlpha ? 'image/webp' : 'image/jpeg';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持图片处理');

  // 预缩放：长边超过 2560px 的先缩到 2560px（ wallpaper 等大图）
  const MAX_EDGE = 2560;
  const longEdge = Math.max(img.width, img.height);
  let scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;

  for (let attempt = 0; attempt < 12; attempt++) {
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // 质量从 0.9 递减，最低 0.5
    const quality = Math.max(0.5, 0.9 - attempt * 0.1);
    const dataUrl = canvas.toDataURL(mime, quality);
    if (dataUrlSize(dataUrl) <= maxBytes) {
      return { dataUrl, mime, size: dataUrlSize(dataUrl) };
    }
    // 前半段只降质量，后半段同时无条件缩小尺寸
    if (attempt >= 4) scale *= 0.7;
    // 尺寸已缩到很小仍超标则放弃
    if (canvas.width <= 64 || canvas.height <= 64) break;
  }
  throw new Error(`图片压缩后仍超过 ${Math.round(maxBytes / 1024)}KB，请换一张更小的图片`);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

export function isDataUrl(s: string): boolean {
  return typeof s === 'string' && s.startsWith('data:image/');
}
