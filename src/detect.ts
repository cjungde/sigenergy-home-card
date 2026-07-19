import type { HomeAssistant } from "custom-card-helpers";
import { InverterConfig, PvStringConfig, RE_INVERTER_PV, RE_PV_STRING } from "./const";

/**
 * Scan hass.states for Sigenergy inverters and their PV strings, based on the
 * entity naming produced by the integration:
 *   sensor.sigen_inverter_<N>_pv_power      -> inverter total PV power
 *   sensor.sigen_inverter_<N>_pv<I>_power   -> PV string I of inverter N
 *
 * Returns an ordered list of inverters, each with its PV-string entities. Works
 * for any number of inverters and strings, and degrades gracefully when only one
 * of the two entity types is present.
 */
export function detectInverters(hass: HomeAssistant): InverterConfig[] {
  interface Acc {
    pv_power?: string;
    strings: { idx: number; power: string }[];
  }
  const byInverter = new Map<number, Acc>();
  const ensure = (n: number): Acc => {
    let inv = byInverter.get(n);
    if (!inv) {
      inv = { strings: [] };
      byInverter.set(n, inv);
    }
    return inv;
  };

  for (const entityId of Object.keys(hass.states)) {
    const pv = entityId.match(RE_INVERTER_PV);
    if (pv) {
      ensure(parseInt(pv[1], 10)).pv_power = entityId;
      continue;
    }
    const str = entityId.match(RE_PV_STRING);
    if (str) {
      ensure(parseInt(str[1], 10)).strings.push({
        idx: parseInt(str[2], 10),
        power: entityId,
      });
    }
  }

  return [...byInverter.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, acc]): InverterConfig => {
      const strings: PvStringConfig[] = acc.strings
        .sort((a, b) => a.idx - b.idx)
        .map((s) => ({ name: `PV${s.idx}`, power: s.power }));
      return { name: `Inverter ${n}`, pv_power: acc.pv_power, strings };
    });
}
