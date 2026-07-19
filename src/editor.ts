import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { DEFAULT_ENTITIES, SigenCardConfig } from "./const";
import { localize } from "./localize";
import { detectInverters } from "./detect";
import { DEFAULT_BACKGROUND } from "./default-bg";

@customElement("sigenergy-home-card-editor")
export class SigenergyHomeCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: SigenCardConfig;
  @state() private _detectMsg = "";

  public setConfig(config: SigenCardConfig): void {
    this._config = { ...config, entities: { ...(config.entities || {}) } };
  }

  /** Scan hass.states for inverters/PV strings and store them, enabling the
   *  breakdown. This is the multi-inverter equivalent of the entity autofill. */
  private _detect(): void {
    const inverters = detectInverters(this.hass);
    const strings = inverters.reduce((n, inv) => n + (inv.strings?.length || 0), 0);
    this._detectMsg = localize("editor.detect_result", this.hass.language, {
      inverters: inverters.length,
      strings,
    });
    this._emit({
      ...this._config,
      inverters,
      show_breakdown: inverters.length > 0 ? true : this._config.show_breakdown,
    });
  }

  /** Autofill: fill every unset entity with its default guess, but only if that
   *  entity actually exists in this HA instance. This is the "autofill" the
   *  community thread asked for. */
  private _autofill(): void {
    const entities = { ...(this._config.entities || {}) };
    for (const d of DEFAULT_ENTITIES) {
      if (!entities[d.key] && this.hass.states[d.entity]) {
        entities[d.key] = d.entity;
      }
    }
    this._emit({ ...this._config, entities });
  }

  private _emit(config: SigenCardConfig): void {
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })
    );
  }

  private _pick(ev: CustomEvent, key: string): void {
    const value = ev.detail.value as string;
    const entities = { ...(this._config.entities || {}) };
    if (value) entities[key] = value;
    else delete entities[key];
    this._emit({ ...this._config, entities });
  }

  private _titleChanged(ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    this._emit({ ...this._config, title: value || undefined });
  }

  private _imageChanged(ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    this._emit({ ...this._config, image: value || undefined });
  }

  private _t(key: string): string {
    return localize(key, this.hass?.language);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="editor">
        <img class="setup-image" src=${this._config.image || DEFAULT_BACKGROUND} alt="Background preview" />

        <ha-textfield
          label=${this._t("editor.title")}
          .value=${this._config.title ?? ""}
          @input=${this._titleChanged}
        ></ha-textfield>

        <ha-textfield
          label=${this._t("editor.image")}
          .value=${this._config.image ?? ""}
          .placeholder=${"/local/sigen/home.png"}
          @input=${this._imageChanged}
        ></ha-textfield>

        <div class="row">
          <ha-button raised @click=${this._autofill}>${this._t("editor.autofill")}</ha-button>
          <span class="hint">${this._t("editor.autofill_hint")}</span>
        </div>

        ${DEFAULT_ENTITIES.map(
          (d) => html`
            <ha-entity-picker
              .hass=${this.hass}
              .label=${this._t("entity." + d.key) + (d.required ? " *" : "")}
              .value=${this._config.entities?.[d.key] ?? ""}
              .includeDomains=${[d.domain]}
              allow-custom-entity
              @value-changed=${(e: CustomEvent) => this._pick(e, d.key)}
            ></ha-entity-picker>
          `
        )}

        <ha-formfield label=${this._t("editor.invert_battery")}>
          <ha-switch
            .checked=${!!this._config.invert_battery}
            @change=${(e: Event) =>
              this._emit({ ...this._config, invert_battery: (e.target as HTMLInputElement).checked })}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label=${this._t("editor.hide_battery")}>
          <ha-switch
            .checked=${!!this._config.hide_battery}
            @change=${(e: Event) =>
              this._emit({ ...this._config, hide_battery: (e.target as HTMLInputElement).checked })}
          ></ha-switch>
        </ha-formfield>

        <div class="row">
          <ha-button raised @click=${this._detect}>${this._t("editor.detect")}</ha-button>
          <span class="hint">
            ${this._detectMsg || this._t("editor.detect_hint")}
          </span>
        </div>

        <ha-formfield label=${this._t("editor.show_breakdown")}>
          <ha-switch
            .checked=${!!this._config.show_breakdown}
            @change=${(e: Event) =>
              this._emit({ ...this._config, show_breakdown: (e.target as HTMLInputElement).checked })}
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .setup-image {
      display: block;
      width: 100%;
      height: auto;
      max-width: 480px;
      margin: 0 auto 8px;
      border-radius: 12px;
    }
    ha-textfield,
    ha-entity-picker {
      width: 100%;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
  `;
}
