// 刮刮乐抽离脚本（规格书 §八）
// 用法：node scripts/extract-guaguale.mjs [源文件路径]
// 默认源文件：site/../刮刮乐-单文件版.html
// 产物：site/public/games/guaguale/index.html + assets/ 图片（背景转 jpg q80，透明贴图转 webp，失败回退 png）
// 除图片引用外逻辑一字不改（保留 localStorage 键 gualale_prizes_v2）。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(siteRoot, '..', '刮刮乐-单文件版.html');
const outDir = path.join(siteRoot, 'public', 'games', 'guaguale');
const assetsDir = path.join(outDir, 'assets');

if (!existsSync(srcPath)) {
  console.error(`找不到源文件：${srcPath}`);
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('缺少 sharp，请先在 site/ 下执行 npm install（sharp 为 devDependency）');
  process.exit(1);
}

const html = await readFile(srcPath, 'utf8');
const re = /data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)/g;

const matches = [...html.matchAll(re)];
if (matches.length === 0) {
  console.error('未在源文件中找到 base64 内联图片');
  process.exit(1);
}
console.log(`找到 ${matches.length} 张内联图片`);

await mkdir(assetsDir, { recursive: true });

let out = html;
let total = 0;
const seen = new Map(); // base64 -> 文件名，用于去重
for (let i = 0; i < matches.length; i++) {
  const [dataUrl, mime, base64] = matches[i];
  const buf = Buffer.from(base64, 'base64');

  // 同一张图可能被多次内联（内容相同的 base64），去重复用同一文件
  const dup = seen.get(base64);
  if (dup) {
    out = out.split(dataUrl).join(`assets/${dup}`);
    console.log(`  ${dup}: 与前面的图片内容相同，复用`);
    continue;
  }

  const meta = await sharp(buf).metadata();
  const transparent = Boolean(meta.hasAlpha) || mime === 'png' || mime === 'webp' || mime === 'gif';

  let ext;
  let outBuf;
  if (transparent) {
    // 贴图保透明：webp，失败回退 png
    try {
      outBuf = await sharp(buf).webp({ quality: 85 }).toBuffer();
      ext = 'webp';
    } catch {
      outBuf = await sharp(buf).png({ compressionLevel: 9 }).toBuffer();
      ext = 'png';
    }
  } else {
    // 背景图：jpg q80
    outBuf = await sharp(buf).jpeg({ quality: 80 }).toBuffer();
    ext = 'jpg';
  }

  const name = `img-${i + 1}.${ext}`;
  seen.set(base64, name);
  await writeFile(path.join(assetsDir, name), outBuf);
  out = out.split(dataUrl).join(`assets/${name}`);
  total += outBuf.length;
  console.log(
    `  ${name}: ${(buf.length / 1024).toFixed(0)}KB -> ${(outBuf.length / 1024).toFixed(0)}KB（${meta.width}x${meta.height}${transparent ? '，含透明' : ''}）`,
  );
}

if (!out.includes('gualale_prizes_v2')) {
  console.warn('⚠️ 警告：产物中未找到 localStorage 键 gualale_prizes_v2，请检查源文件');
}

await writeFile(path.join(outDir, 'index.html'), out, 'utf8');
console.log(`\n输出目录：${outDir}`);
console.log(`图片总大小：${(total / 1024 / 1024).toFixed(2)}MB（目标 ≤2MB）`);
console.log(`index.html 大小：${(Buffer.byteLength(out, 'utf8') / 1024).toFixed(0)}KB`);
