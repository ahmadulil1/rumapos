// ponytail: generator PNG murni Node tanpa dependensi natif.
// Upgrade: ganti sharp jika butuh grafis kompleks.
const zlib = require('zlib');
const fs = require('fs');

function PNG(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(new Uint8Array(w * 4));
  return { w, h, rows };
}

function px(img, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (x | 0) * 4;
  img.rows[y | 0][i] = r;
  img.rows[y | 0][i + 1] = g;
  img.rows[y | 0][i + 2] = b;
  img.rows[y | 0][i + 3] = a;
}

function inShape(img, x, y, radius) {
  if (radius <= 0) return true;
  const cx = img.w / 2, cy = img.h / 2;
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  const lim = img.w / 2 - radius;
  if (dx > lim && dy > lim) {
    const ddx = dx - lim, ddy = dy - lim;
    return ddx * ddx + ddy * ddy <= radius * radius;
  }
  return true;
}

// Bitmap R tebal 12x14
const R_GRID = [
  '111111111000',
  '111111111100',
  '111000001110',
  '111000000110',
  '111000000110',
  '111000001110',
  '111111111100',
  '111111111000',
  '111000111000',
  '111000011100',
  '111000001110',
  '111000001110',
  '111000000111',
  '111000000111',
];

function drawR(img, x0, y0, w, h, col) {
  const gw = R_GRID[0].length, gh = R_GRID.length;
  const cw = w / gw, ch = h / gh;
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (R_GRID[gy][gx] === '1') {
        const px0 = Math.floor(x0 + gx * cw);
        const px1 = Math.ceil(x0 + (gx + 1) * cw);
        const py0 = Math.floor(y0 + gy * ch);
        const py1 = Math.ceil(y0 + (gy + 1) * ch);
        for (let y = py0; y < py1; y++) {
          for (let x = px0; x < px1; x++) {
            px(img, x, y, col[0], col[1], col[2], col[3] ?? 255);
          }
        }
      }
    }
  }
}

function encode(img) {
  const raw = [];
  for (const row of img.rows) {
    raw.push(Buffer.from([0]));
    raw.push(Buffer.from(row));
  }
  const idat = zlib.deflateSync(Buffer.concat(raw));
  const b = (n) => Buffer.from(n.toString(16).padStart(8, '0').match(/../g).map((h) => parseInt(h, 16)));
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.concat([b(img.w), b(img.h), Buffer.from([8, 6, 0, 0, 0])]);
  const chunks = [
    Buffer.concat([Buffer.from('IHDR'), ihdr]),
    Buffer.concat([Buffer.from('IDAT'), idat]),
    Buffer.from('IEND'),
  ];
  const out = [sig];
  for (const c of chunks) {
    const len = b(c.length - 4);
    const crc = Buffer.alloc(4);
    let z = 0xffffffff;
    for (const byte of c) {
      z ^= byte;
      for (let i = 0; i < 8; i++) z = (z & 1) ? (z >>> 1) ^ 0xedb88320 : z >>> 1;
    }
    crc.writeUInt32BE((z ^ 0xffffffff) >>> 0);
    out.push(len, c, crc);
  }
  return Buffer.concat(out);
}

function makeIcon(size, radius, withR) {
  const img = PNG(size, size);
  // 1. Gambar background gradient (#7C3AED -> #4C1D95)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inShape(img, x, y, radius)) continue;
      const t = (x / size + y / size) / 2;
      const r = Math.round(124 + (76 - 124) * t);
      const g = Math.round(58 + (29 - 58) * t);
      const b = Math.round(237 + (149 - 237) * t);
      px(img, x, y, r, g, b, 255);
    }
  }
  // 2. Gambar huruf R putih DI ATAS background
  if (withR) {
    const rw = size * 0.44;
    const rh = size * 0.52;
    const rx = (size - rw) / 2;
    const ry = (size - rh) / 2;
    drawR(img, rx, ry, rw, rh, [255, 255, 255, 255]);
  }
  return img;
}

function makeForeground(size) {
  // Transparan total, hanya huruf R di tengah safe zone
  const img = PNG(size, size);
  const rw = size * 0.38;
  const rh = size * 0.46;
  const rx = (size - rw) / 2;
  const ry = (size - rh) / 2;
  drawR(img, rx, ry, rw, rh, [255, 255, 255, 255]);
  return img;
}

const res = process.argv[2];
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

for (const [d, s] of Object.entries(sizes)) {
  const dir = `${res}/${d}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/ic_launcher.png`, encode(makeIcon(s, s * 0.22, true)));
  fs.writeFileSync(`${dir}/ic_launcher_round.png`, encode(makeIcon(s, s / 2, true)));
  fs.writeFileSync(`${dir}/ic_launcher_foreground.png`, encode(makeForeground(s)));
}

// Background layer untuk adaptive icon
const bgDir = `${res}/values`;
fs.mkdirSync(bgDir, { recursive: true });

// Simpan juga versi 512 untuk store
fs.writeFileSync(`${res}/../icon-512.png`, encode(makeIcon(512, 512 * 0.22, true)));
console.log('Ikon selesai dibuat ulang dengan huruf R jelas.');
