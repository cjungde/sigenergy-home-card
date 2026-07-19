// Minimal, dependency-free localization for the card.
// Language is taken from `hass.language` (falls back to English). German is the
// second first-class language since the Sigenergy community is heavily DACH-based.

type Dict = Record<string, string>;

const en: Dict = {
  // node labels
  "node.solar": "Solar",
  "node.grid": "Grid",
  "node.battery": "Battery",
  "node.home": "Home",
  "node.ev": "EV",
  // states
  "state.idle": "idle",
  // editor
  "editor.title": "Title (optional)",
  "editor.image": "Background image (optional, overrides bundled render)",
  "editor.autofill": "Autofill Sigenergy entities",
  "editor.autofill_hint": "Fills any empty field with the matching sigen_* entity that exists here.",
  "editor.invert_battery": "Invert battery sign (positive = charging)",
  "editor.hide_battery": "Hide battery (no-ESS / PV-only)",
  "editor.show_breakdown": "Show inverter / PV-string breakdown",
  "editor.detect": "Detect inverters & PV strings",
  "editor.detect_hint": "Scans for sigen_inverter_*_pv*_power entities and fills the breakdown.",
  "editor.detect_result": "Found {inverters} inverter(s), {strings} PV string(s).",
  "breakdown.title": "PV strings",
  // entity picker labels
  "entity.pv_power": "PV / Solar power",
  "entity.pv_power_third_party": "Third-party PV power",
  "entity.grid_import_power": "Grid import power",
  "entity.grid_export_power": "Grid export power",
  "entity.battery_power": "Battery (ESS) power",
  "entity.battery_soc": "Battery SoC",
  "entity.load_power": "House load power",
  "entity.ems_mode": "EMS work mode",
  "entity.ev_power": "EV charger power",
  "entity.ev_state": "EV charger state",
  "entity.ev_energy": "EV charger total energy",
};

const de: Dict = {
  "node.solar": "Solar",
  "node.grid": "Netz",
  "node.battery": "Batterie",
  "node.home": "Haus",
  "node.ev": "E-Auto",
  "state.idle": "inaktiv",
  "editor.title": "Titel (optional)",
  "editor.image": "Hintergrundbild (optional, ersetzt mitgelieferte Grafik)",
  "editor.autofill": "Sigenergy-Entitäten automatisch ausfüllen",
  "editor.autofill_hint": "Füllt leere Felder mit der passenden vorhandenen sigen_*-Entität.",
  "editor.invert_battery": "Batterievorzeichen umkehren (positiv = Laden)",
  "editor.hide_battery": "Batterie ausblenden (ohne Speicher / nur PV)",
  "editor.show_breakdown": "Wechselrichter-/PV-String-Aufschlüsselung anzeigen",
  "editor.detect": "Wechselrichter & PV-Strings erkennen",
  "editor.detect_hint": "Sucht nach sigen_inverter_*_pv*_power-Entitäten und füllt die Aufschlüsselung.",
  "editor.detect_result": "{inverters} Wechselrichter, {strings} PV-String(s) gefunden.",
  "breakdown.title": "PV-Strings",
  "entity.pv_power": "PV-/Solarleistung",
  "entity.pv_power_third_party": "PV-Leistung Fremdwechselrichter",
  "entity.grid_import_power": "Netzbezugsleistung",
  "entity.grid_export_power": "Netzeinspeiseleistung",
  "entity.battery_power": "Batterieleistung (ESS)",
  "entity.battery_soc": "Batterie-Ladezustand",
  "entity.load_power": "Hausverbrauchsleistung",
  "entity.ems_mode": "EMS-Betriebsmodus",
  "entity.ev_power": "Ladeleistung Wallbox",
  "entity.ev_state": "Status Wallbox",
  "entity.ev_energy": "Gesamtenergie Wallbox",
};

const LANGS: Record<string, Dict> = { en, de };

/**
 * Resolve a translation for the given hass language, falling back to English.
 * Supports `{name}` placeholders substituted from `params`.
 */
export function localize(
  key: string,
  language?: string,
  params?: Record<string, string | number>
): string {
  const lang = (language || "en").toLowerCase().split("-")[0];
  const dict = LANGS[lang] || en;
  let str = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
