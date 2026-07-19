// Default entity IDs for the Sigenergy Local Modbus integration (domain: `sigen`).
//
// The integration uses `_attr_has_entity_name = True`, so entity_ids are derived
// from "<device> <entity name>". The single-plant device is named "Sigen Plant",
// AC chargers "Sigen AC Charger", giving the slugs below. These are DEFAULTS only —
// every field is overridable in the card editor, which is what makes the card work
// with renamed devices, multiple plants, or third-party inverter setups.
//
// Source keys (custom_components/sigen/{calculated,static}_sensor.py):
//   plant_photovoltaic_power, plant_third_party_photovoltaic_power,
//   plant_grid_import_power, plant_grid_export_power, plant_ess_power,
//   plant_ess_soc, plant_consumed_power, plant_ems_work_mode,
//   ac_charger_charging_power, ac_charger_system_state, ac_charger_total_energy_consumed

export interface SigenDefault {
  /** config key on the card */
  key: string;
  /** default entity_id guess */
  entity: string;
  /** entity domain used to filter the picker */
  domain: "sensor" | "select";
  /** whether the flow node is required to render */
  required?: boolean;
}

// The human-readable label for each key lives in `localize.ts` under `entity.<key>`,
// so it is translated and defined in exactly one place.
export const DEFAULT_ENTITIES: SigenDefault[] = [
  { key: "pv_power", entity: "sensor.sigen_plant_photovoltaic_power", domain: "sensor", required: true },
  { key: "pv_power_third_party", entity: "sensor.sigen_plant_third_party_photovoltaic_power", domain: "sensor" },
  { key: "grid_import_power", entity: "sensor.sigen_plant_grid_import_power", domain: "sensor", required: true },
  { key: "grid_export_power", entity: "sensor.sigen_plant_grid_export_power", domain: "sensor", required: true },
  { key: "battery_power", entity: "sensor.sigen_plant_ess_power", domain: "sensor" },
  { key: "battery_soc", entity: "sensor.sigen_plant_ess_soc", domain: "sensor" },
  { key: "load_power", entity: "sensor.sigen_plant_consumed_power", domain: "sensor", required: true },
  { key: "ems_mode", entity: "sensor.sigen_plant_ems_work_mode", domain: "sensor" },
  { key: "ev_power", entity: "sensor.sigen_ac_charger_charging_power", domain: "sensor" },
  { key: "ev_state", entity: "sensor.sigen_ac_charger_system_state", domain: "sensor" },
  { key: "ev_energy", entity: "sensor.sigen_ac_charger_total_energy_consumed", domain: "sensor" },
];

export const CARD_VERSION = "0.1.0";

/** Default idle threshold in watts (single source; used by setConfig + render). */
export const DEFAULT_IDLE_THRESHOLD_W = 20;

// A single PV string (MPPT input) of an inverter.
//   power entity_id e.g. sensor.sigen_inverter_1_pv1_power
export interface PvStringConfig {
  /** display name, e.g. "PV1" */
  name?: string;
  /** power entity_id (kW) */
  power: string;
}

// One inverter and its PV strings. Entity naming from the integration:
//   sensor.sigen_inverter_<N>_pv_power     (inverter total PV)
//   sensor.sigen_inverter_<N>_pv<I>_power  (per-string)
export interface InverterConfig {
  /** display name, e.g. "Inverter 1" */
  name?: string;
  /** inverter total PV power entity_id (kW) */
  pv_power?: string;
  /** per-string power entities */
  strings?: PvStringConfig[];
}

/** Regexes for auto-detecting inverter / PV-string entities in hass.states. */
export const RE_INVERTER_PV = /^sensor\.sigen_inverter_(\d+)_pv_power$/;
export const RE_PV_STRING = /^sensor\.sigen_inverter_(\d+)_pv(\d+)_power$/;

// Battery power sign convention: the sigen `plant_ess_power` reports positive when
// discharging and negative when charging (matching mySigen). Override if your
// firmware differs.
export interface SigenCardConfig {
  type: string;
  title?: string;
  /** invert battery sign if your value is positive-on-charge */
  invert_battery?: boolean;
  /** watt threshold below which a flow is treated as idle (no animation) */
  idle_threshold_w?: number;
  /** show the bundled background artwork (default true) */
  background?: boolean;
  /** artwork opacity 0..1 (default 1) */
  background_opacity?: number;
  /** force-hide the battery node even if a battery entity exists (no-ESS look) */
  hide_battery?: boolean;
  /** show the per-inverter / per-PV-string breakdown below the flow diagram */
  show_breakdown?: boolean;
  /** inverters and their PV strings (populated by the editor's Detect button) */
  inverters?: InverterConfig[];
  entities?: Record<string, string>;
}
