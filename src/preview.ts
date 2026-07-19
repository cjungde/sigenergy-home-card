// Integrated setup image, bundled directly into the card as an inline SVG
// data-URI. There is NOTHING to download or copy to /config/www — the image
// ships inside the compiled .js. Shown at the top of the config editor.
//
// Matches the card's own visual language: a stylized isometric "digital twin"
// (house + PV roof, Sigenstor tower, EV) with domain-colored, glowing flow
// nodes. Fixed hex colors (not CSS vars) are used because an <img> data-URI
// renders outside the document's stylesheet scope.

const A = "#1a7f5a"; // accent / home
const SOLAR = "#f6b93b";
const GRID = "#e55039";
const BATT = "#4a9df7";

function dot(x: number, y: number, color: string): string {
  return `
    <circle cx="${x}" cy="${y}" r="11" fill="#16211f" stroke="${color}" stroke-width="2.5" filter="url(#soft)"/>
    <circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
}

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200">
  <defs>
    <radialGradient id="halo" cx="50%" cy="60%" r="60%">
      <stop offset="0" stop-color="${A}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${A}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>

  <rect width="480" height="200" rx="14" fill="#101917"/>
  <rect width="480" height="200" rx="14" fill="url(#halo)"/>

  <!-- ground -->
  <ellipse cx="240" cy="168" rx="150" ry="16" fill="${A}" fill-opacity="0.12"/>

  <!-- ===== isometric house ===== -->
  <g stroke="${A}" stroke-width="1.5" stroke-linejoin="round">
    <path d="M 200 108 L 240 128 L 240 158 L 200 138 Z" fill="${A}" fill-opacity="0.16"/>
    <path d="M 240 128 L 280 108 L 280 138 L 240 158 Z" fill="${A}" fill-opacity="0.09"/>
    <path d="M 200 108 L 240 128 L 280 108 L 240 88 Z" fill="${A}" fill-opacity="0.10" stroke="none"/>
    <path d="M 200 108 L 240 128 L 240 74 Z" fill="${A}" fill-opacity="0.24"/>
    <path d="M 240 128 L 280 108 L 240 74 Z" fill="${A}" fill-opacity="0.15"/>
  </g>
  <g stroke="${SOLAR}" stroke-width="1" fill="${SOLAR}" fill-opacity="0.20">
    <path d="M 249 110 L 267 100 L 273 108 L 255 118 Z"/>
  </g>

  <!-- ===== Sigenstor tower ===== -->
  <g stroke="${A}" stroke-width="1.5" stroke-linejoin="round">
    <path d="M 330 118 L 346 128 L 346 162 L 330 152 Z" fill="${A}" fill-opacity="0.16"/>
    <path d="M 346 128 L 358 121 L 358 155 L 346 162 Z" fill="${A}" fill-opacity="0.09"/>
    <path d="M 330 118 L 346 110 L 358 121 L 346 128 Z" fill="${A}" fill-opacity="0.24"/>
  </g>

  <!-- ===== EV ===== -->
  <g stroke="${A}" stroke-width="1.5" stroke-linejoin="round">
    <path d="M 118 150 L 146 136 L 164 145 L 136 159 Z" fill="${A}" fill-opacity="0.10"/>
    <path d="M 118 150 L 136 159 L 136 168 L 118 159 Z" fill="${A}" fill-opacity="0.16"/>
    <path d="M 130 144 L 148 135 L 158 140 L 140 149 Z" fill="${A}" fill-opacity="0.20"/>
  </g>

  <!-- glowing flow connectors + nodes -->
  <g fill="none" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 9" filter="url(#soft)">
    <path d="M 240 52 L 240 82" stroke="${SOLAR}"/>
    <path d="M 96 118 C 150 110, 190 116, 224 122" stroke="${GRID}" opacity="0.5"/>
    <path d="M 384 100 C 340 104, 300 112, 262 120" stroke="${BATT}"/>
  </g>
  ${dot(240, 45, SOLAR)}
  ${dot(90, 118, GRID)}
  ${dot(390, 96, BATT)}
  ${dot(240, 180, A)}

  <text x="24" y="30" fill="#e6f4ee" font-family="system-ui,Segoe UI,Roboto,sans-serif"
        font-size="15" font-weight="700">Sigenergy Home Card</text>
</svg>`;

/** The bundled setup image as a ready-to-use `src` value for an <img>. */
export const PREVIEW_IMAGE: string =
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVG.trim());
