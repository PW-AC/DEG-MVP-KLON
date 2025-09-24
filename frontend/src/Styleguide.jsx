import React from "react";

const ColorSwatch = ({ name, hsl }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
    <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: `hsl(${hsl})`, boxShadow: "var(--shadow-sm)" }} />
    <div style={{ fontFamily: "var(--font-body)" }}>
      <strong>{name}</strong>
      <div style={{ fontSize: 12, color: "hsl(var(--gray-600))" }}>{hsl}</div>
    </div>
  </div>
);

export default function Styleguide() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <h1>Design Tokens</h1>
      <p>Brand colors, typography, spacing, and components. Use tokens, never hardcode colors.</p>

      <section style={{ marginTop: 24 }}>
        <h2>Colors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 12 }}>
          <ColorSwatch name="Primary 900" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-primary-900')} />
          <ColorSwatch name="Primary 400" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-primary-400')} />
          <ColorSwatch name="Primary 50" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-primary-50')} />
          <ColorSwatch name="Accent" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-accent')} />
          <ColorSwatch name="Accent 50" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-accent-50')} />
          <ColorSwatch name="Gray 900" hsl={getComputedStyle(document.documentElement).getPropertyValue('--gray-900')} />
          <ColorSwatch name="Gray 600" hsl={getComputedStyle(document.documentElement).getPropertyValue('--gray-600')} />
          <ColorSwatch name="Gray 200" hsl={getComputedStyle(document.documentElement).getPropertyValue('--gray-200')} />
          <ColorSwatch name="White" hsl={getComputedStyle(document.documentElement).getPropertyValue('--color-white')} />
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Typography</h2>
        <h1 style={{ marginTop: 12 }}>H1 — Tenor Sans</h1>
        <h2>H2 — Tenor Sans</h2>
        <h3>H3 — Tenor Sans</h3>
        <h4>H4 — Tenor Sans</h4>
        <p style={{ marginTop: 12 }}>Body — Open Sans 400 with comfortable line-height. Nulla vitae elit libero, a pharetra augue.</p>
        <p style={{ fontWeight: 600 }}>Body Semibold — Open Sans 600 for emphasis or UI text.</p>
        <div className="caption">Caption — 12–14px for meta text.</div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Buttons</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn">Primary</button>
          <button className="btn" disabled>Primary Disabled</button>
          <button className="status-btn">Secondary</button>
          <button className="table-btn">Subtle</button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Inputs</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 12 }}>
          <div>
            <label htmlFor="sg-text">Text input</label>
            <input id="sg-text" type="text" placeholder="Placeholder" />
          </div>
          <div>
            <label htmlFor="sg-select">Select</label>
            <select id="sg-select"><option>Option</option></select>
          </div>
        </div>
      </section>
    </div>
  );
}

