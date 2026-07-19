import { LitElement, html, css, svg, nothing, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCard, LovelaceCardEditor } from "custom-card-helpers";
import {
  CARD_VERSION,
  DEFAULT_ENTITIES,
  DEFAULT_IDLE_THRESHOLD_W,
  InverterConfig,
  SigenCardConfig,
} from "./const";
import { backgroundDefs, backgroundLayer } from "./assets";
import { localize } from "./localize";

interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

/** Clamp a number into the [0, 1] range (used for background opacity). */
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** One flow-diagram node. `tap`/`hold` are the more-info entities (optional). */
interface NodeSpec {
  x: number;
  y: number;
  icon: string;
  label: string;
  value: string;
  active: boolean;
  color: string;
  tap?: string;
  hold?: string;
}

/* eslint-disable no-console */
console.info(
  `%c SIGENERGY-HOME-CARD %c v${CARD_VERSION} `,
  "color: white; background: #1a7f5a; font-weight: 700;",
  "color: #1a7f5a; background: white; font-weight: 700;"
);

// Register in the "Add card" picker.
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards || [];
w.customCards.push({
  type: "sigenergy-home-card",
  name: "Sigenergy Home Card",
  description: "Animated energy-flow view for the Sigenergy Local Modbus integration.",
  preview: true,
  documentationURL: "https://github.com/cjungde/sigenergy-home-card",
});

// Domain accent colors. The single source of truth is the `:host` custom-property
// block in `styles` below; both the node rings/icons (via these var() refs) and
// the flow-line CSS classes read the same tokens, so they can never drift.
const COLORS = {
  solar: "var(--sig-solar)",
  grid: "var(--sig-grid)",
  battery: "var(--sig-battery)",
  home: "var(--sig-home)",
  ev: "var(--sig-ev)",
} as const;

@customElement("sigenergy-home-card")
export class SigenergyHomeCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: SigenCardConfig;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./editor");
    return document.createElement("sigenergy-home-card-editor") as LovelaceCardEditor;
  }

  public static getStubConfig(): SigenCardConfig {
    const entities: Record<string, string> = {};
    for (const d of DEFAULT_ENTITIES) entities[d.key] = d.entity;
    return { type: "custom:sigenergy-home-card", entities };
  }

  public setConfig(config: SigenCardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      idle_threshold_w: DEFAULT_IDLE_THRESHOLD_W,
      ...config,
      entities: { ...(config.entities || {}) },
    };
  }

  public getCardSize(): number {
    return 6;
  }

  /** Numeric watt value for an entity_id, in W (integration reports kW). */
  private _wattsOf(id?: string): number {
    if (!id || !this.hass) return 0;
    const st = this.hass.states[id];
    if (!st || st.state === "unavailable" || st.state === "unknown") return 0;
    const v = parseFloat(st.state);
    if (isNaN(v)) return 0;
    const unit = (st.attributes?.unit_of_measurement || "").toLowerCase();
    return unit.startsWith("kw") ? v * 1000 : v;
  }

  /** Numeric watt value for a config key, in W. */
  private _watts(key: string): number {
    return this._wattsOf(this._config.entities?.[key]);
  }

  private _raw(key: string): string | undefined {
    const id = this._config.entities?.[key];
    if (!id || !this.hass) return undefined;
    return this.hass.states[id]?.state;
  }

  private _id(key: string): string | undefined {
    return this._config.entities?.[key] || undefined;
  }

  private _fmt(w: number): string {
    const a = Math.abs(w);
    return a >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${Math.round(w)} W`;
  }

  private _t(key: string): string {
    return localize(key, this.hass?.language);
  }

  // ---- tap / hold -> more-info -------------------------------------------
  private _holdTimer?: number;
  private _held = false;

  private _moreInfo(entityId?: string): void {
    if (!entityId || !this.hass?.states[entityId]) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Handlers are arrow-function class properties so their identity is stable
  // across renders — lit binds each listener once instead of rebinding on every
  // hass tick (review item #2). They are delegated on the container and read the
  // target node's entities from data-* attributes.
  private _clearHold(): void {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
  }

  private _nodeData(e: Event): { tap?: string; hold?: string } {
    const el = (e.target as Element | null)?.closest?.(".node") as HTMLElement | null;
    return { tap: el?.dataset.tap || undefined, hold: el?.dataset.hold || undefined };
  }

  private _onPointerDown = (e: PointerEvent): void => {
    this._held = false;
    const { hold } = this._nodeData(e);
    if (!hold) return;
    this._holdTimer = window.setTimeout(() => {
      this._held = true;
      this._moreInfo(hold);
    }, 500);
  };

  private _onPointerUp = (e: PointerEvent): void => {
    this._clearHold();
    if (!this._held) this._moreInfo(this._nodeData(e).tap);
    this._held = false;
  };

  private _onPointerCancel = (): void => {
    this._clearHold();
    this._held = false;
  };

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const { tap } = this._nodeData(e);
    if (tap) this._moreInfo(tap);
  };

  private _onBreakdownClick = (e: Event): void => {
    const el = (e.target as Element | null)?.closest?.(".bd-string") as HTMLElement | null;
    if (el?.dataset.entity) this._moreInfo(el.dataset.entity);
  };

  /** Every entity_id this card actually reads — used to gate re-renders. */
  private _usedEntityIds(): string[] {
    const ids = Object.values(this._config?.entities ?? {}).filter(Boolean) as string[];
    for (const inv of this._config?.inverters ?? []) {
      if (inv.pv_power) ids.push(inv.pv_power);
      for (const s of inv.strings ?? []) if (s.power) ids.push(s.power);
    }
    return ids;
  }

  // `hass` is reassigned on every state change of ANY entity in HA. Only
  // re-render when the config or one of OUR entities actually changed, otherwise
  // the card repaints many times per second on a busy instance (review item #1).
  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has("_config")) return true;
    if (!changed.has("hass")) return false;
    const old = changed.get("hass") as HomeAssistant | undefined;
    if (!old || !this.hass) return true;
    return this._usedEntityIds().some((id) => old.states[id] !== this.hass.states[id]);
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;

    const idle = this._config.idle_threshold_w ?? DEFAULT_IDLE_THRESHOLD_W;
    const pv = this._watts("pv_power") + this._watts("pv_power_third_party");
    const gridImport = this._watts("grid_import_power");
    const gridExport = this._watts("grid_export_power");
    const load = this._watts("load_power");
    const ev = this._watts("ev_power");
    let battery = this._watts("battery_power");
    if (this._config.invert_battery) battery = -battery;
    const soc = this._raw("battery_soc");
    const ems = this._raw("ems_mode");

    // No-ESS mode: hidden when explicitly disabled, or auto when no battery
    // entity is configured / present (PV + grid only, e.g. third-party inverter).
    const battId = this._id("battery_power");
    const hasBattery = !this._config.hide_battery && !!battId && !!this.hass.states[battId];

    // battery > 0 => discharging (flows to home); < 0 => charging (flows from bus)
    const batteryDischarge = hasBattery ? Math.max(0, battery) : 0;
    const batteryCharge = hasBattery ? Math.max(0, -battery) : 0;

    // EV takes the battery slot when there is no battery, otherwise sits below Home.
    const evY = hasBattery ? 300 : 210;
    const evFromY = hasBattery ? 270 : 160;

    // Ring/icon color is driven purely by the `.active`/`.idle` class + the
    // `--node-color` custom property in CSS (review item #5). Pointer/keyboard
    // handling is delegated on the <svg>; each node just carries its entities
    // as data-* and a color token as a custom property.
    const node = (n: NodeSpec) => {
      const clickable = !!(n.tap || n.hold);
      return svg`
      <g
        class="node ${n.active ? "active" : "idle"} ${clickable ? "clickable" : ""}"
        transform="translate(${n.x},${n.y})"
        style="--node-color:${n.color}"
        role=${clickable ? "button" : "presentation"}
        aria-label=${clickable ? `${n.label}: ${n.value}` : nothing}
        tabindex=${clickable ? "0" : "-1"}
        data-tap=${n.tap ?? nothing}
        data-hold=${n.hold ?? nothing}
      >
        <circle r="34" class="node-bg" />
        <g transform="translate(-12,-24)">
          <ha-icon icon="${n.icon}"></ha-icon>
        </g>
        <text class="node-label" y="46">${n.label}</text>
        <text class="node-value" y="62">${n.value}</text>
      </g>`;
    };

    const flow = (x1: number, y1: number, x2: number, y2: number, on: boolean, cls: string) => {
      const mx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      return svg`
        <path class="flow-line ${cls}" d="${d}" />
        ${on ? svg`<path class="flow-anim ${cls}" d="${d}" />` : ""}`;
    };

    return html`
      <ha-card .header=${this._config.title}>
        <div class="wrap">
          <svg
            viewBox="0 0 360 320"
            class="diagram"
            @pointerdown=${this._onPointerDown}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
            @pointerleave=${this._onPointerCancel}
            @keydown=${this._onKeyDown}
          >
            ${backgroundDefs()}
            ${this._config.background === false
              ? svg``
              : backgroundLayer(clamp01(this._config.background_opacity ?? 1), hasBattery)}
            ${flow(180, 60, 180, 160, pv > idle, "solar")}
            ${flow(60, 210, 180, 160, gridImport > idle, "grid-in")}
            ${flow(180, 160, 60, 210, gridExport > idle, "grid-out")}
            ${hasBattery ? flow(300, 210, 180, 160, batteryDischarge > idle, "batt-out") : ""}
            ${hasBattery ? flow(180, 160, 300, 210, batteryCharge > idle, "batt-in") : ""}
            ${flow(180, 160, 180, 270, load > idle, "load")}
            ${ev > idle ? flow(180, evFromY, 300, evY, ev > idle, "ev") : ""}

            ${node({
              x: 180, y: 60, icon: "mdi:solar-power-variant", color: COLORS.solar,
              label: this._t("node.solar"), value: this._fmt(pv), active: pv > idle,
              tap: this._id("pv_power"), hold: this._id("pv_power_third_party"),
            })}
            ${node({
              x: 60, y: 210, icon: "mdi:transmission-tower", color: COLORS.grid,
              label: this._t("node.grid"),
              // Signed: negative = exporting, positive = importing (_fmt keeps the sign).
              value: this._fmt(gridExport > gridImport ? -gridExport : gridImport),
              active: gridImport > idle || gridExport > idle,
              tap: this._id("grid_import_power"), hold: this._id("grid_export_power"),
            })}
            ${hasBattery
              ? node({
                  x: 300, y: 210, icon: "mdi:battery-high", color: COLORS.battery,
                  label: soc ? `${Math.round(parseFloat(soc))}%` : this._t("node.battery"),
                  // battery is signed: >0 discharging, <0 charging.
                  value: battery === 0 ? this._t("state.idle") : this._fmt(battery),
                  active: batteryCharge > idle || batteryDischarge > idle,
                  tap: this._id("battery_power"), hold: this._id("battery_soc"),
                })
              : svg``}
            ${node({
              x: 180, y: 270, icon: "mdi:home", color: COLORS.home,
              label: this._t("node.home"), value: this._fmt(load), active: load > idle,
              tap: this._id("load_power"), hold: this._id("ems_mode"),
            })}
            ${ev > idle
              ? node({
                  x: 300, y: evY, icon: "mdi:ev-station", color: COLORS.ev,
                  label: this._t("node.ev"), value: this._fmt(ev), active: true,
                  tap: this._id("ev_power"), hold: this._id("ev_energy"),
                })
              : svg``}
          </svg>
          ${ems ? html`<div class="ems">${ems}</div>` : ""}
          ${this._renderBreakdown()}
        </div>
      </ha-card>
    `;
  }

  /** Per-inverter / per-PV-string breakdown table below the flow diagram. */
  private _renderBreakdown(): TemplateResult | typeof nothing {
    if (!this._config.show_breakdown) return nothing;
    const inverters = this._config.inverters || [];
    if (inverters.length === 0) return nothing;

    // Scale bars against the largest single string across all inverters.
    let maxString = 0;
    for (const inv of inverters)
      for (const s of inv.strings || []) maxString = Math.max(maxString, this._wattsOf(s.power));
    const denom = maxString > 0 ? maxString : 1;

    const invRow = (inv: InverterConfig) => {
      const strings = inv.strings || [];
      const total = inv.pv_power
        ? this._wattsOf(inv.pv_power)
        : strings.reduce((sum, s) => sum + this._wattsOf(s.power), 0);
      return html`
        <div class="bd-inverter">
          <div class="bd-inv-head">
            <span class="bd-inv-name">${inv.name || this._t("node.solar")}</span>
            <span class="bd-inv-total">${this._fmt(total)}</span>
          </div>
          ${strings.map((s) => {
            const w = this._wattsOf(s.power);
            return html`
              <div class="bd-string ${s.power ? "clickable" : ""}" data-entity=${s.power ?? nothing}>
                <span class="bd-str-name">${s.name || "PV"}</span>
                <span class="bd-bar"><span class="bd-fill" style="width:${(w / denom) * 100}%"></span></span>
                <span class="bd-str-val">${this._fmt(w)}</span>
              </div>
            `;
          })}
        </div>
      `;
    };

    return html`
      <div class="breakdown" @click=${this._onBreakdownClick}>
        <div class="bd-title">${this._t("breakdown.title")}</div>
        ${inverters.map(invRow)}
      </div>
    `;
  }

  static styles = css`
    /* Single source of truth for the domain palette (design review item #3). */
    :host {
      --sig-solar: #f6b93b;
      --sig-grid: #e55039;
      --sig-grid-export: #78e08f;
      --sig-battery: #4a9df7;
      --sig-battery-charge: #7f8fa6;
      --sig-home: var(--primary-color, #1a7f5a);
      --sig-ev: #9b59b6;
    }
    ha-card {
      overflow: hidden;
    }
    .wrap {
      position: relative;
      padding: 8px 8px 12px;
    }
    .diagram {
      width: 100%;
      height: auto;
    }
    .sig-artwork {
      pointer-events: none;
    }
    .node-bg {
      fill: var(--card-background-color, #fff);
      stroke: var(--divider-color, #e0e0e0);
      stroke-width: 2;
      transition: stroke 0.3s ease, stroke-width 0.2s ease;
    }
    /* Idle nodes recede so the active flow reads at a glance (design item #2). */
    .node.idle {
      opacity: 0.55;
    }
    /* Active node uses its domain color (--node-color, set per node); idle keeps
       the neutral divider stroke from .node-bg above (review item #5). */
    .node.active .node-bg {
      stroke: var(--node-color, var(--primary-color, #1a7f5a));
      stroke-width: 2.5;
    }
    .node ha-icon {
      --mdc-icon-size: 24px;
      color: var(--secondary-text-color);
    }
    .node.active ha-icon {
      color: var(--node-color, var(--primary-color, #1a7f5a));
    }
    .node.clickable {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .node.clickable:hover {
      opacity: 1;
    }
    .node.clickable:hover .node-bg,
    .node.clickable:focus-visible .node-bg {
      stroke: var(--node-color, var(--primary-color, #1a7f5a));
      stroke-width: 3;
    }
    .node.clickable:focus-visible {
      outline: none;
    }
    .node-label {
      text-anchor: middle;
      font-size: 11px;
      fill: var(--secondary-text-color);
    }
    .node-value {
      text-anchor: middle;
      font-size: 12px;
      font-weight: 700;
      fill: var(--primary-text-color);
    }
    .flow-line {
      fill: none;
      stroke: var(--divider-color, #e0e0e0);
      stroke-width: 2;
      opacity: 0.5;
    }
    .flow-anim {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 4 14;
      filter: url(#sig-flow-glow);
      animation: dash 1.1s linear infinite;
    }
    .flow-anim.solar { stroke: var(--sig-solar); }
    .flow-anim.grid-in { stroke: var(--sig-grid); }
    .flow-anim.grid-out { stroke: var(--sig-grid-export); }
    .flow-anim.batt-out { stroke: var(--sig-battery); }
    .flow-anim.batt-in { stroke: var(--sig-battery-charge); }
    .flow-anim.load { stroke: var(--sig-home); }
    .flow-anim.ev { stroke: var(--sig-ev); }
    @keyframes dash {
      to { stroke-dashoffset: -36; }
    }
    .ems {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color, #1a7f5a);
      margin-top: 4px;
    }
    .breakdown {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .bd-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .bd-inverter {
      margin-bottom: 8px;
    }
    .bd-inv-head {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin-bottom: 2px;
    }
    .bd-string {
      display: grid;
      grid-template-columns: 40px 1fr 64px;
      align-items: center;
      gap: 8px;
      padding: 2px 0;
    }
    .bd-string.clickable {
      cursor: pointer;
    }
    .bd-str-name {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .bd-bar {
      display: block;
      height: 8px;
      border-radius: 4px;
      background: var(--divider-color, #e0e0e0);
      overflow: hidden;
    }
    .bd-fill {
      display: block;
      height: 100%;
      border-radius: 4px;
      background: var(--sig-solar);
      transition: width 0.4s ease;
    }
    .bd-str-val {
      font-size: 12px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
    }
    @media (prefers-reduced-motion: reduce) {
      .flow-anim { animation: none; }
    }
  `;
}
