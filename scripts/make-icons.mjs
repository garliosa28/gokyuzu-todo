// Bağımlılıksız PNG ikon üretici: koyu zemin üzerinde açık renkli bir tik işareti.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [38, 38, 36]
const FG = [246, 245, 242]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (const b of buf) {
    c = (crc ^ b) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

// Noktanın (px,py) doğru parçasına (a-b) uzaklığı
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

function png(size) {
  const s = size
  const stroke = s * 0.075
  const p1 = [s * 0.29, s * 0.52], p2 = [s * 0.44, s * 0.67], p3 = [s * 0.72, s * 0.36]
  const raw = Buffer.alloc((s * 3 + 1) * s)
  for (let y = 0; y < s; y++) {
    raw[y * (s * 3 + 1)] = 0
    for (let x = 0; x < s; x++) {
      const d = Math.min(
        distToSegment(x + 0.5, y + 0.5, ...p1, ...p2),
        distToSegment(x + 0.5, y + 0.5, ...p2, ...p3),
      )
      const a = Math.max(0, Math.min(1, stroke - d + 0.5)) // kenar yumuşatma
      const o = y * (s * 3 + 1) + 1 + x * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(BG[i] * (1 - a) + FG[i] * a)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(s, 0)
  ihdr.writeUInt32BE(s, 4)
  ihdr[8] = 8 // bit derinliği
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size))
}
console.log('ikonlar üretildi')
