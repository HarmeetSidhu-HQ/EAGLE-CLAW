"use client";
import React, { useEffect, useRef, useState } from "react";

const STEPS = [
  { num: "01", title: "ARM YOUR VAULT", desc: "Provide your Solana wallet, a recipient address, and encrypt your payload. Set a heartbeat threshold — 24h, 72h, or custom." },
  { num: "02", title: "SEND HEARTBEATS", desc: "Ping the protocol regularly. As long as we receive your signal, your vault stays sealed. No signal = trigger condition met." },
  { num: "03", title: "AUTO-RELEASE", desc: "If your threshold expires without a heartbeat, the encrypted payload is atomically released to your recipient. Zero human intervention." },
];

const USECASES = [
  { icon: "◈", label: "Journalists" },
  { icon: "⬡", label: "Whistleblowers" },
  { icon: "◎", label: "Crypto Inheritance" },
  { icon: "△", label: "DAO Governance" },
  { icon: "◇", label: "Founders" },
  { icon: "⊕", label: "Legal Escrow" },
];

const SPECS = [
  { label: "Network", value: "Solana Devnet / Mainnet" },
  { label: "Trigger Check", value: "Every 1 Hour (Cron)" },
  { label: "Threshold Range", value: "1 sec → Unlimited" },
  { label: "Payload Format", value: "Base64 Encrypted" },
  { label: "Status Types", value: "active · triggered" },
  { label: "DB", value: "PostgreSQL + Encore.ts" },
];

function NavBar() {
  return (
    <nav className="ec-nav">
      <div className="ec-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 28, height: 28, background: "var(--ec-accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⊗</div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.08em", color: "var(--ec-white)" }}>EAGLE CLAW</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="status-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)", letterSpacing: "0.1em" }}>DEVNET LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Protocol", "Docs", "GitHub"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-muted)", letterSpacing: "0.1em", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--ec-white)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--ec-muted)")}>{l}</a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i); }, []);
  const timeStr = new Date().toISOString().replace("T", " ").slice(0, 19);

  return (
    <section style={{ paddingTop: 160, paddingBottom: 120, position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      {/* Glows */}
      <div className="bg-glow" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)", top: -100, left: "50%", transform: "translateX(-50%)" }} />
      <div className="bg-glow" style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(232,201,106,0.06) 0%, transparent 70%)", bottom: 0, right: 100 }} />

      <div className="ec-container" style={{ position: "relative", zIndex: 2 }}>
        {/* Badge */}
        <div className="fade-up d-100" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <div className="tag"><div className="status-dot" style={{ width: 6, height: 6 }} />Beta Imminent</div>
          <div className="tag">⬡ Solana · IPFS · Encore.ts</div>
        </div>

        {/* Headline */}
        <h1 className="fade-up d-200" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 6vw, 84px)", lineHeight: 0.92, letterSpacing: "0.01em", marginBottom: 32, maxWidth: 900 }}>
          <span className="gradient-text" style={{ display: "block" }}>TRUTH CANNOT BE BURIED.</span>
        </h1>

        <p className="fade-up d-300" style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ec-muted)", lineHeight: 1.8, maxWidth: 520, marginBottom: 48 }}>
          A cryptographic dead-man&apos;s switch for journalists, activists, and crypto holders. Set a threshold. Send heartbeats. If you go silent — the truth releases automatically.
        </p>

        {/* CTAs */}
        <div className="fade-up d-400" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 80 }}>
          <button className="btn-primary">ARM YOUR VAULT →</button>
          <button className="btn-ghost">READ THE SPEC</button>
        </div>

        {/* Live terminal card */}
        <div className="ec-card fade-up d-500" style={{ maxWidth: 540, padding: "20px 24px", borderColor: "rgba(124,92,252,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)", marginLeft: 8, letterSpacing: "0.08em" }}>eagle-claw · monitor · live</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.9, color: "rgba(244,244,246,0.6)" }}>
            <div><span style={{ color: "var(--ec-accent)" }}>$</span> curl POST /heartbeat</div>
            <div style={{ color: "#22c55e" }}>✓ Heartbeat received · {timeStr}<span className="cursor-blink">_</span></div>
            <div><span style={{ color: "var(--ec-accent)" }}>$</span> next_trigger: +72h</div>
            <div style={{ color: "var(--ec-gold)" }}>⊗ Switch status: <span style={{ color: "var(--ec-green)" }}>ACTIVE</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="ec-section">
      <div className="ec-container">
        <div className="fade-up" style={{ marginBottom: 64 }}>
          <div className="tag" style={{ marginBottom: 16 }}>How It Works</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 56px)", color: "var(--ec-white)", letterSpacing: "0.03em" }}>THREE STEPS TO IMMORTAL TRUTH</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="ec-card" style={{ padding: 32, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -10, fontFamily: "var(--font-display)", fontSize: 100, color: "rgba(124,92,252,0.05)", lineHeight: 1, userSelect: "none" }}>{s.num}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ec-accent)", letterSpacing: "0.15em", marginBottom: 16 }}>{s.num}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--ec-white)", letterSpacing: "0.05em", marginBottom: 14 }}>{s.title}</h3>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ec-muted)", lineHeight: 1.9 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SwitchPreview() {
  const [status] = useState<"active" | "triggered">("active");
  const threshold = 72 * 3600;
  const progress = 31;

  return (
    <section className="ec-section" style={{ background: "linear-gradient(180deg, transparent, rgba(124,92,252,0.04), transparent)" }}>
      <div className="ec-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div className="tag" style={{ marginBottom: 16 }}>Switch Dashboard</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", color: "var(--ec-white)", letterSpacing: "0.03em", marginBottom: 20, lineHeight: 1.1 }}>YOUR VAULT AT A GLANCE</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ec-muted)", lineHeight: 1.9, marginBottom: 32 }}>
              Once armed, your dashboard shows exactly how much time remains before your switch triggers. One heartbeat resets the clock.
            </p>
            <button className="btn-primary">ARM YOUR VAULT →</button>
          </div>

          {/* Mock dashboard card */}
          <div className="ec-card" style={{ padding: 32, borderColor: "rgba(124,92,252,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(124,92,252,0.06), transparent 60%)", borderRadius: 20, pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)", letterSpacing: "0.12em", marginBottom: 6 }}>SWITCH ID</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ec-white)" }}>f3a9…c82d</div>
              </div>
              <div className="tag" style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}>
                <div className="status-dot" style={{ width: 6, height: 6 }} />{status.toUpperCase()}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-muted)" }}>Heartbeat Window</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-white)" }}>72h threshold</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-accent)" }}>22h 17m elapsed</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)" }}>49h 43m remaining</span>
              </div>
            </div>

            <div style={{ height: 1, background: "var(--ec-border)", marginBottom: 24 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Recipient", value: "7xKp…3mQz" },
                { label: "Threshold", value: "72 Hours" },
                { label: "Last Ping", value: "2h 17m ago" },
                { label: "Payload", value: "Encrypted ✓" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ec-white)" }}>{value}</div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              ♡ SEND HEARTBEAT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechSpecs() {
  return (
    <section className="ec-section">
      <div className="ec-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <div className="tag" style={{ marginBottom: 16 }}>Architecture</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", color: "var(--ec-white)", letterSpacing: "0.03em", marginBottom: 32, lineHeight: 1.1 }}>BUILT ON ZERO TRUST</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {SPECS.map(({ label, value }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--ec-border)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-muted)", letterSpacing: "0.08em" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-white)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="tag" style={{ marginBottom: 8 }}>Use Cases</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {USECASES.map(({ icon, label }) => (
                <div key={label} className="ec-card" style={{ padding: "20px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, color: "var(--ec-accent)" }}>{icon}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ec-white)", letterSpacing: "0.06em" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...USECASES, ...USECASES, ...USECASES, ...USECASES];
  return (
    <div style={{ padding: "40px 0", borderTop: "1px solid var(--ec-border)", borderBottom: "1px solid var(--ec-border)", overflow: "hidden", position: "relative" }}>
      <div style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}>
        <div className="marquee-track" style={{ display: "flex", gap: 48, width: "max-content" }}>
          {items.map(({ icon, label }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.45 }}>
              <span style={{ fontSize: 16, color: "var(--ec-accent)" }}>{icon}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ec-white)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <section style={{ padding: "120px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div className="bg-glow" style={{ width: 700, height: 400, background: "radial-gradient(ellipse, rgba(124,92,252,0.1) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div className="ec-container" style={{ position: "relative", zIndex: 2 }}>
        <div className="tag" style={{ margin: "0 auto 24px", display: "inline-flex" }}>Early Access</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 8vw, 96px)", color: "var(--ec-white)", letterSpacing: "0.02em", lineHeight: 0.95, marginBottom: 24 }}>
          PROTECT WHAT<br /><span className="gradient-text">MATTERS.</span>
        </h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ec-muted)", marginBottom: 48, maxWidth: 440, margin: "0 auto 48px" }}>
          Be among the first to deploy a decentralized dead-man&apos;s switch on Solana.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ fontSize: 12, padding: "14px 36px" }}>JOIN THE WAITLIST</button>
          <button className="btn-ghost" style={{ fontSize: 12, padding: "14px 36px" }}>VIEW DOCS</button>
        </div>
      </div>
    </section>
  );
}

function BottomBar() {
  return (
    <div className="ec-bottom-bar">
      <div className="ec-container" style={{ display: "flex", alignItems: "center", gap: 32, height: "100%" }}>
        <div style={{ display: "flex", gap: 32, width: "max-content", animation: "marquee 40s linear infinite" }}>
          {["72H TIMELOCK", "SOLANA MAINNET", "CRON TRIGGER: 1H", "BASE64 ENCRYPTED", "ZERO TRUST", "POSTGRESQL", "ENCORE.TS", "OPEN SOURCE SOON"].flatMap((t, i, a) =>
            [<span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ec-muted)", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{t}</span>,
             i < a.length - 1 ? <span key={`d${i}`} style={{ color: "var(--ec-border-bright)" }}>·</span> : null]
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main style={{ background: "var(--ec-black)", minHeight: "100vh", paddingBottom: 44 }}>
      <NavBar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <SwitchPreview />
      <TechSpecs />
      <CTA />
      <BottomBar />
    </main>
  );
}
