// 从 修改意见.docx 提取 media 图片并用 sharp 压缩，方便放入上下文审查。
// 运行：node scripts/extract-docx-media.mjs （在 site 目录下）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const DOCX = path.resolve(SITE, '../修改意见.docx');
const OUT_DIR = path.join(SITE, '../_审查素材/压缩图');

fs.mkdirSync(OUT_DIR, { recursive: true });

const data = fs.readFileSync(DOCX);
const zip = await JSZip.loadAsync(data);
const media = Object.keys(zip.files)
  .filter((n) => n.startsWith('word/media/') && !zip.files[n].dir)
  .sort();

console.log(`media 文件数: ${media.length}`);

for (const name of media) {
  const file = zip.files[name];
  const buf = await file.async('nodebuffer');
  const base = path.basename(name);

  try {
    const meta = await sharp(buf).metadata();
    const maxSide = 1000;
    const scale = Math.min(1, maxSide / Math.max(meta.width || 1, meta.height || 1));
    const w = Math.round((meta.width || 1) * scale);
    const h = Math.round((meta.height || 1) * scale);
    const outName = base.replace(/\.[^.]+$/, '.jpg');
    const outPath = path.join(OUT_DIR, outName);
    const outBuf = await sharp(buf).resize(w, h).jpeg({ quality: 78 }).toBuffer();
    fs.writeFileSync(outPath, outBuf);
    console.log(`${outName} ${w}x${h} ${buf.length}->${outBuf.length} bytes`);
  } catch (e) {
    console.log(`[err] ${base}: ${e.message}`);
  }
}

console.log('完成');