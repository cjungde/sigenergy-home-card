import { svg, SVGTemplateResult } from "lit";

// Bundled, self-contained background artwork for the flow diagram.
// Everything is inline SVG using `currentColor` / theme CSS vars, so there are
// NO external image files to copy to /config/www (the pain point of the YAML
// dashboards this card replaces).
//
// This is a committed, stylized *isometric* "digital twin" scene — a house with
// a PV roof, the Sigenstor battery tower, and an EV — echoing the mySigen app
// look while staying vector, themeable, and asset-free. Drawn to sit behind the
// flow nodes on the 360x320 viewBox without fighting label legibility.
//   Solar (180,60)  Grid (60,210)  Bus (180,160)  Battery (300,210)  Home (180,270)

const ACCENT = "var(--primary-color, #1a7f5a)";
const PV = "var(--warning-color, #f6b93b)";

/** Gradient + filter defs referenced by the artwork and the flow glow. Rendered once. */
export const backgroundDefs = (): SVGTemplateResult => svg`
  <defs>
    <radialGradient id="sig-glow" cx="50%" cy="55%" r="65%">
      <stop offset="0%" stop-color=${ACCENT} stop-opacity="0.14" />
      <stop offset="100%" stop-color=${ACCENT} stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sig-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color=${ACCENT} stop-opacity="0.0" />
      <stop offset="100%" stop-color=${ACCENT} stop-opacity="0.12" />
    </linearGradient>
    <!-- soft glow applied to the animated flow dashes (design item #3) -->
    <filter id="sig-flow-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.8" />
    </filter>
  </defs>`;

/**
 * Isometric digital-twin backdrop drawn behind the flow lines and nodes.
 * `opacity` scales the whole layer (config `background_opacity`); `showBattery`
 * hides the Sigenstor tower in no-ESS mode.
 */
export const backgroundLayer = (
  opacity: number,
  showBattery = true
): SVGTemplateResult => svg`
  <g class="sig-artwork" opacity=${opacity}>
    <rect x="0" y="0" width="360" height="320" fill="url(#sig-glow)" />
    <ellipse cx="180" cy="292" rx="150" ry="22" fill="url(#sig-ground)" />

    <!-- ===== House (isometric cuboid + pitched roof) ===== -->
    <g stroke=${ACCENT} stroke-width="1.5" stroke-linejoin="round">
      <!-- left wall (darker) -->
      <path d="M 120 178 L 180 208 L 180 254 L 120 224 Z" fill=${ACCENT} fill-opacity="0.16" />
      <!-- right wall (lighter) -->
      <path d="M 180 208 L 240 178 L 240 224 L 180 254 Z" fill=${ACCENT} fill-opacity="0.09" />
      <!-- roof base (fills the back so no gap shows through the peak) -->
      <path d="M 120 178 L 180 208 L 240 178 L 180 148 Z"
        fill=${ACCENT} fill-opacity="0.10" stroke="none" />
      <!-- two pitched front slopes meeting at a high apex (180,126) -->
      <path d="M 120 178 L 180 208 L 180 126 Z" fill=${ACCENT} fill-opacity="0.24" />
      <path d="M 180 208 L 240 178 L 180 126 Z" fill=${ACCENT} fill-opacity="0.15" />
    </g>

    <!-- PV panels on the front-right roof slope -->
    <g stroke=${PV} stroke-width="1" fill=${PV} fill-opacity="0.20" opacity="0.9">
      <path d="M 192 178 L 216 164 L 224 176 L 200 190 Z" />
      <path d="M 204 171 L 212 183 M 214 165 L 222 177" stroke-opacity="0.7" />
    </g>

    <!-- window on the left wall -->
    <path d="M 134 200 L 150 208 L 150 222 L 134 214 Z"
      fill=${ACCENT} fill-opacity="0.28" stroke=${ACCENT} stroke-width="1" />

    ${showBattery
      ? svg`
      <!-- ===== Sigenstor battery tower (tall iso box) ===== -->
      <g stroke=${ACCENT} stroke-width="1.5" stroke-linejoin="round">
        <path d="M 286 232 L 306 244 L 306 296 L 286 284 Z" fill=${ACCENT} fill-opacity="0.16" />
        <path d="M 306 244 L 322 234 L 322 286 L 306 296 Z" fill=${ACCENT} fill-opacity="0.09" />
        <path d="M 286 232 L 306 220 L 322 234 L 306 244 Z" fill=${ACCENT} fill-opacity="0.24" />
        <!-- module seams -->
        <path d="M 286 250 L 306 262 M 286 266 L 306 278" stroke-opacity="0.5" />
        <path d="M 306 262 L 322 252 M 306 278 L 322 268" stroke-opacity="0.5" />
      </g>`
      : svg``}

    <!-- ===== EV (low rounded iso block) ===== -->
    <g stroke=${ACCENT} stroke-width="1.5" stroke-linejoin="round">
      <path d="M 44 262 L 80 244 L 104 256 L 68 274 Z" fill=${ACCENT} fill-opacity="0.10" />
      <path d="M 44 262 L 68 274 L 68 286 L 44 274 Z" fill=${ACCENT} fill-opacity="0.16" />
      <path d="M 68 274 L 104 256 L 104 268 L 68 286 Z" fill=${ACCENT} fill-opacity="0.09" />
      <!-- cabin -->
      <path d="M 60 254 L 82 243 L 96 250 L 74 261 Z" fill=${ACCENT} fill-opacity="0.20" />
    </g>
  </g>`;
