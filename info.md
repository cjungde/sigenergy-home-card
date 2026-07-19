# Sigenergy Home Card

Animated **energy-flow card** that recreates the mySigen "Home" view for the
[Sigenergy Local Modbus integration](https://github.com/TypQxQ/Sigenergy-Local-Modbus)
(`sigen` domain) — as a real custom card, with **no `card-mod` or `mushroom-legacy-template-card`** to break on updates.

## Features

- ⚡ Animated flows: solar, grid import/export, battery charge/discharge, house load, EV charger
- 🪄 **Autofill** — one click fills the real `sensor.sigen_*` entities (overridable per field)
- 👆 Tap → more-info, hold → secondary entity (keyboard accessible)
- 🎨 Bundled background artwork + integrated setup preview image — nothing to copy to `/config/www`
- 🌍 English + German (follows `hass.language`)
- 🔆 Multi-inverter & per-PV-string breakdown with **Detect** auto-scan
- 🔋 No-ESS / PV-only mode (battery node auto-hides)

## Setup

1. Install via HACS, then reload resources (or restart your browser).
2. Add a card → search **Sigenergy Home Card**.
3. Click **Autofill Sigenergy entities** (and **Detect inverters & PV strings** if you have PV data).

That's it — every entity stays overridable in the visual editor, so renamed devices and
third-party inverters work too.

## Minimal YAML

```yaml
type: custom:sigenergy-home-card
title: Energy
entities:
  pv_power: sensor.sigen_plant_photovoltaic_power
  grid_import_power: sensor.sigen_plant_grid_import_power
  grid_export_power: sensor.sigen_plant_grid_export_power
  battery_power: sensor.sigen_plant_ess_power
  battery_soc: sensor.sigen_plant_ess_soc
  load_power: sensor.sigen_plant_consumed_power
```

See the [README](https://github.com/cjungde/sigenergy-home-card) for all options.
