import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import sharp from "sharp"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fontPath = resolve(root, "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2")
const outputPath = resolve(root, "public/og-home.png")
const font = (await readFile(fontPath)).toString("base64")

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0b0d"/>
      <stop offset="0.62" stop-color="#14151a"/>
      <stop offset="1" stop-color="#1c1d25"/>
    </linearGradient>
    <linearGradient id="blueSlot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f7cff"/>
      <stop offset="1" stop-color="#164eaa"/>
    </linearGradient>
    <linearGradient id="cyanSlot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#31b7e9"/>
      <stop offset="1" stop-color="#2559d8"/>
    </linearGradient>
    <linearGradient id="violetSlot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8d79ff"/>
      <stop offset="1" stop-color="#4e38a9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.84" cy="0.12" r="0.72">
      <stop offset="0" stop-color="#4f7cff" stop-opacity="0.28"/>
      <stop offset="0.52" stop-color="#3158c8" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#0b0b0d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.12"/>
    </linearGradient>
    <filter id="blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#000000" flood-opacity="0.48"/>
    </filter>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" stroke-opacity="0.035"/>
    </pattern>
    <clipPath id="largeClip"><rect x="756" y="196" width="158" height="252" rx="18"/></clipPath>
    <clipPath id="topClip"><rect x="932" y="196" width="158" height="112" rx="18"/></clipPath>
    <clipPath id="bottomClip"><rect x="932" y="324" width="158" height="124" rx="18"/></clipPath>
    <style>
      @font-face {
        font-family: Geist;
        src: url(data:font/woff2;base64,${font}) format("woff2");
        font-weight: 100 900;
      }
      text { font-family: Geist, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="1200" height="630" fill="url(#background)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.65"/>
  <circle cx="1060" cy="82" r="118" fill="#4f7cff" fill-opacity="0.12" filter="url(#blur)"/>
  <circle cx="716" cy="548" r="170" fill="#3158c8" fill-opacity="0.07" filter="url(#blur)"/>

  <rect x="52" y="52" width="1096" height="526" rx="32" fill="none" stroke="#ffffff" stroke-opacity="0.1"/>
  <path d="M 88 126 H 286" stroke="#5d86ff" stroke-width="3" stroke-linecap="round"/>
  <text x="88" y="112" fill="#91aaff" font-size="15" font-weight="700" letter-spacing="3.2">TWIBBON / LINK TOOL</text>

  <text x="88" y="236" fill="#fafafa" font-size="76" font-weight="760" letter-spacing="-3.8">OpenFrame</text>
  <text x="92" y="294" fill="#c7cad4" font-size="29" font-weight="460">Buat dan bagikan twibbon</text>
  <text x="92" y="334" fill="#c7cad4" font-size="29" font-weight="460">tanpa ribet.</text>

  <rect x="88" y="398" width="374" height="54" rx="27" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.12"/>
  <circle cx="116" cy="425" r="7" fill="#5d86ff"/>
  <text x="137" y="432" fill="#e0e3eb" font-size="18" font-weight="520">twibbon.anasubaid.my.id</text>
  <text x="92" y="500" fill="#858a99" font-size="17" font-weight="450">Gratis, tanpa akun untuk mulai.</text>

  <text x="1006" y="552" fill="#ffffff" fill-opacity="0.035" font-size="170" font-weight="800" text-anchor="middle" letter-spacing="-12">OP</text>

  <g filter="url(#shadow)">
    <rect x="716" y="136" width="386" height="374" rx="28" fill="#252832" fill-opacity="0.86" stroke="#ffffff" stroke-opacity="0.2"/>
    <rect x="738" y="158" width="342" height="24" rx="12" fill="#ffffff" fill-opacity="0.07"/>
    <circle cx="758" cy="170" r="5" fill="#5d86ff"/>
    <text x="776" y="176" fill="#aab1c2" font-size="12" font-weight="700" letter-spacing="2.2">OPENFRAME / PHOTO FRAME</text>

    <rect x="756" y="196" width="158" height="252" rx="18" fill="url(#blueSlot)"/>
    <rect x="932" y="196" width="158" height="112" rx="18" fill="url(#cyanSlot)"/>
    <rect x="932" y="324" width="158" height="124" rx="18" fill="url(#violetSlot)"/>

    <g clip-path="url(#largeClip)" fill="#ffffff" fill-opacity="0.18">
      <circle cx="844" cy="258" r="36"/>
      <path d="M 750 448 C 772 364 802 344 842 344 C 884 344 908 381 922 448 Z"/>
      <path d="M 748 226 L 912 410" stroke="#ffffff" stroke-width="18" stroke-opacity="0.1"/>
    </g>
    <g clip-path="url(#topClip)" fill="#ffffff" fill-opacity="0.2">
      <circle cx="1011" cy="238" r="23"/>
      <path d="M 928 308 C 946 265 968 255 1006 255 C 1048 255 1072 275 1096 308 Z"/>
    </g>
    <g clip-path="url(#bottomClip)" fill="#ffffff" fill-opacity="0.16">
      <circle cx="1010" cy="362" r="24"/>
      <path d="M 925 448 C 948 404 975 390 1012 390 C 1052 390 1074 412 1097 448 Z"/>
    </g>

    <rect x="756" y="196" width="334" height="252" rx="18" fill="url(#shine)" opacity="0.16"/>
    <path d="M 756 468 H 1090" stroke="#ffffff" stroke-opacity="0.12"/>
    <text x="756" y="490" fill="#aab1c2" font-size="13" font-weight="700" letter-spacing="2.5">03 SLOT FRAME</text>
    <text x="1090" y="490" fill="#7f8db5" font-size="13" font-weight="600" text-anchor="end">READY TO SHARE</text>
  </g>

  <path d="M 88 548 H 522" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="88" y="565" fill="#73798a" font-size="13" font-weight="650" letter-spacing="2.4">OPENFRAME</text>
</svg>
`

await sharp(Buffer.from(svg)).png().toFile(outputPath)
console.log(`Generated ${outputPath}`)
