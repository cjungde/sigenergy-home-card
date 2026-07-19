# Sigenergy Home Card

A Home Assistant Lovelace card that recreates the **mySigen "Home" energy-flow view** for the
[Sigenergy Local Modbus integration](https://github.com/TypQxQ/Sigenergy-Local-Modbus)
(`sigen` domain).

![Sigenergy Home Card](https://raw.githubusercontent.com/cjungde/sigenergy-home-card/main/images/preview.png)

> The rendering above is a stylized preview; icons show as tinted Material Design icons in Home Assistant.

Unlike the community YAML dashboards, this is a real custom card:

- **No `card-mod` / `mushroom-legacy-template-card` dependency** — rendering is native SVG in a
  Shadow DOM, so Mushroom updates can never break it.
- **Integrated imagery** — the setup preview and a stylized **isometric digital-twin backdrop**
  (house + PV roof, Sigenstor tower, EV) are bundled as inline SVG; there are no `.png` files to
  download into `/config/www`.
- **Domain-colored, glowing flows** — each node ring/icon and its flow share a color (solar amber,
  grid red, battery blue, home green, EV violet); idle nodes recede and active flows have a soft glow.
- **Autofill config editor** — a visual editor with entity pickers that default to the real
  `sensor.sigen_*` entities, one click to fill them in. Works with renamed devices and
  third-party inverters because every field is overridable.
- **Animated flows** — solar, grid import/export, battery charge/discharge, house load and EV
  charger, with idle detection.
- **Tap / hold → more-info** — tap any node to open the HA more-info dialog for its primary
  entity; press-and-hold (500 ms) opens the secondary entity. Keyboard accessible (Tab + Enter).
- **Localized (en / de)** — node labels and the editor follow `hass.language`; English and German
  ship built in, with an easy path to add more.
- **Multi-inverter & PV-string breakdown** — one *Detect* click scans for
  `sigen_inverter_<N>_pv<I>_power` entities and renders a per-inverter, per-string bar breakdown
  below the flow diagram. Each string bar taps through to more-info.
- **No-ESS / PV-only mode** — the battery node auto-hides when no battery entity is present (e.g.
  third-party inverter setups), and the EV node reflows into its place. Force it with `hide_battery`.

> Status: **v0.1 feature-complete scaffold.** Flow rendering, editor with autofill + detect,
> tap/hold dialogs, background artwork, en/de localization, multi-inverter/PV-string breakdown,
> and no-ESS mode all work. Remaining before release: build verification on Node and real-device
> testing — see [Roadmap](#roadmap).

### Node interactions

| Node | Tap (more-info) | Hold (more-info) |
|------|-----------------|------------------|
| Solar | `pv_power` | `pv_power_third_party` |
| Grid | `grid_import_power` | `grid_export_power` |
| Battery | `battery_power` | `battery_soc` |
| Home | `load_power` | `ems_mode` |
| EV | `ev_power` | `ev_energy` |

A node is only interactive if its entity is configured, and hold falls back silently when no
secondary entity is set.

## Install

### HACS (custom repository)

1. HACS → ⋮ → *Custom repositories*
2. Add `https://github.com/cjungde/sigenergy-home-card`, category **Dashboard**
3. Install, then reload resources (or restart the browser).

### Manual

1. `npm install && npm run build`
2. Copy `dist/sigenergy-home-card.js` to `/config/www/`
3. Add a dashboard resource: `/local/sigenergy-home-card.js`, type **JavaScript Module**.

## Usage

Add card → search *Sigenergy Home Card* → **Autofill Sigenergy entities**. Or in YAML:

```yaml
type: custom:sigenergy-home-card
title: Energy
entities:
  pv_power: sensor.sigen_plant_photovoltaic_power
  pv_power_third_party: sensor.sigen_plant_third_party_photovoltaic_power
  grid_import_power: sensor.sigen_plant_grid_import_power
  grid_export_power: sensor.sigen_plant_grid_export_power
  battery_power: sensor.sigen_plant_ess_power
  battery_soc: sensor.sigen_plant_ess_soc
  load_power: sensor.sigen_plant_consumed_power
  ems_mode: sensor.sigen_plant_ems_work_mode
  ev_power: sensor.sigen_ac_charger_charging_power
  ev_state: sensor.sigen_ac_charger_system_state
  ev_energy: sensor.sigen_ac_charger_total_energy_consumed
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | – | Card header |
| `entities` | see above | Map of flow node → entity_id |
| `invert_battery` | `false` | Set if your `ess_power` is positive when charging |
| `idle_threshold_w` | `20` | Watts below which a flow is treated as idle (no animation) |
| `background` | `true` | Show the bundled background artwork (sun, pylon, battery tower, house) |
| `background_opacity` | `1` | Artwork opacity, `0`–`1` |
| `hide_battery` | `false` | Force-hide the battery node (no-ESS look); it also auto-hides when no battery entity exists |
| `show_breakdown` | `false` | Show the per-inverter / per-PV-string breakdown below the diagram |
| `inverters` | – | List of inverters + PV strings (use the editor's **Detect** button to fill) |

### Inverter / PV-string breakdown

Open the editor and click **Detect inverters & PV strings**, or configure manually:

```yaml
type: custom:sigenergy-home-card
show_breakdown: true
inverters:
  - name: Inverter 1
    pv_power: sensor.sigen_inverter_1_pv_power
    strings:
      - name: PV1
        power: sensor.sigen_inverter_1_pv1_power
      - name: PV2
        power: sensor.sigen_inverter_1_pv2_power
  - name: Inverter 2
    pv_power: sensor.sigen_inverter_2_pv_power
    strings:
      - name: PV1
        power: sensor.sigen_inverter_2_pv1_power
```

Bars are scaled to the largest string across all inverters. If `pv_power` is omitted, the
inverter total is summed from its strings.

## Entity reference

Entity defaults come straight from the integration source
(`custom_components/sigen/{calculated,static}_sensor.py`). Values in kW are auto-converted to W.
Battery convention: `plant_ess_power` positive = discharging, negative = charging (matches
mySigen); flip with `invert_battery` if your firmware differs.

## Roadmap

- [x] Bundled background artwork (inline SVG — sun, pylon, Sigenstor tower, house)
- [x] Tap/hold → `more-info` dialogs per node
- [x] Multi-inverter and PV-string breakdown (with auto-detect)
- [x] Third-party-only inverter mode (no ESS) — auto-hide + `hide_battery`
- [x] Localization (en/de) — add languages in `src/localize.ts`

## License

MIT
