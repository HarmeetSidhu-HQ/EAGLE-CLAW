"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Eye } from "lucide-react";

/* ── Easing ── */
const appleEase = [0.23, 1, 0.32, 1] as const;

/* ── Framer variants ── */
const fadeBlurIn = {
  hidden: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: appleEase, delay },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: appleEase, delay },
  }),
};

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  /* ── Font injection ── */
  useEffect(() => {
    const id = "eagle-claw-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* ── Mouse-track flashlight ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
  }, []);

  return (
    <>
      <style>{`
        /* ── Fonts ── */
        .ec-syne { font-family: 'Syne', sans-serif; }
        .ec-mono { font-family: 'IBM Plex Mono', monospace; }
        .ec-inter { font-family: 'Inter', sans-serif; }

        /* ── Pulse dot — institutional blue ── */
        @keyframes ec-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          70%  { box-shadow: 0 0 0 7px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }

        /* ── Scanline sweep ── */
        @keyframes ec-scanline {
          0%   { top: -2px; }
          100% { top: 100%; }
        }

        /* ── CRT grain ── */
        @keyframes ec-grain {
          0%, 100% { transform: translate(0,0); }
          10% { transform: translate(-1px,-1px); }
          20% { transform: translate(1px,0); }
          30% { transform: translate(0,1px); }
          40% { transform: translate(-1px,1px); }
          50% { transform: translate(1px,-1px); }
          60% { transform: translate(-1px,0); }
          70% { transform: translate(1px,1px); }
          80% { transform: translate(0,-1px); }
          90% { transform: translate(-1px,-1px); }
        }

        /* ── Logo breathe ── */
        @keyframes ec-logoBreathe {
          0%, 100% { opacity: 0.025; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.04;  transform: translate(-50%, -50%) scale(1.02); }
        }

        /* ── CTA interactions ── */
        .ec-cta-primary .ec-arrow {
          display: inline-block;
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .ec-cta-primary:hover .ec-arrow {
          transform: translateX(5px);
        }
        .ec-cta-primary {
          transition: all 0.45s cubic-bezier(0.23,1,0.32,1);
          box-shadow: 0 0 0 rgba(34,197,94,0);
          letter-spacing: 0.14em;
        }
        .ec-cta-primary:hover {
          box-shadow: 0 0 28px rgba(34,197,94,0.3), 0 0 8px rgba(34,197,94,0.15);
          letter-spacing: 0.2em;
          background: #1fad4f !important;
        }
        .ec-cta-secondary {
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .ec-cta-secondary:hover {
          border-color: rgba(34,197,94,0.5) !important;
          color: #e8eaf0 !important;
        }
      `}</style>

      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          background: "#080a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* ── Flashlight radial — mouse-tracked ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(650px circle at ${mouse.x}% ${mouse.y}%, rgba(13,26,58,0.35) 0%, rgba(13,26,58,0.08) 40%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
            transition: "background 0.3s ease-out",
          }}
        />

        {/* ── Static radial glow (fallback center) ── */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "500px",
            background:
              "radial-gradient(ellipse at center, rgba(13,26,58,0.3) 0%, rgba(13,26,58,0.06) 55%, transparent 78%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Logo watermark ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "420px",
            height: "420px",
            backgroundImage: "url('/eagle-claw-logo.jpg')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            mixBlendMode: "screen",
            opacity: 0.01,
            filter: "blur(0.1px) saturate(0)",
            pointerEvents: "none",
            zIndex: 1,
            animation: "ec-logoBreathe 8s ease-in-out infinite",
          }}
        />
        {/* ── Logo edge blend mask ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at center, transparent 20%, #080a0f 80%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* ── CRT grain overlay ── */}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            width: "200%",
            height: "200%",
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
            opacity: 0.09,
            pointerEvents: "none",
            zIndex: 3,
            animation: "ec-grain 0.5s steps(6) infinite",
          }}
        />

        {/* ── Scanline sweep ── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.02) 80%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 4,
            animation: "ec-scanline 8s linear infinite",
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 32px",
            maxWidth: "64rem",
            width: "100%",
          }}
        >
          {/* ── Status badge ── */}
          <motion.div
            className="ec-mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "48px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#3b82f6",
                display: "inline-block",
                flexShrink: 0,
                animation: "ec-pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                color: "rgba(232,234,240,0.5)",
                textTransform: "uppercase" as const,
              }}
            >
              SYSTEM ARMED — SOLANA MAINNET
            </span>
          </motion.div>

          {/* ── Parent Brand Super-Header ── */}
          <motion.p
            className="ec-inter"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.15}
            style={{
              fontSize: "56px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#e8eaf0",
              opacity: 0.4,
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}
          >
            EAGLE CLAW
          </motion.p>

          {/* ── Eyebrow ── */}
          <motion.p
            className="ec-mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.25}
            style={{
              fontSize: "10px",
              fontWeight: 400,
              letterSpacing: "0.3em",
              color: "#4a5568",
              textTransform: "uppercase" as const,
              marginBottom: "28px",
            }}
          >
            DECENTRALIZED DEAD-MAN&#39;S SWITCH PROTOCOL
          </motion.p>

          {/* ── Headline — Apple blur-scale reveal ── */}
          <h1
            className="ec-syne"
            style={{
              marginBottom: "40px",
              lineHeight: 1.05,
              fontWeight: 600,
            }}
          >
            <motion.span
              variants={fadeBlurIn}
              initial="hidden"
              animate="visible"
              custom={0.35}
              style={{
                display: "block",
                fontSize: "clamp(12px, 4vw, 24px)",
                color: "#e8eaf0",
                letterSpacing: "-0.04em",
                textTransform: "uppercase" as const,
              }}
            >
              IF THEY TAKE YOU,
            </motion.span>
            <motion.span
              variants={fadeBlurIn}
              initial="hidden"
              animate="visible"
              custom={0.5}
              style={{
                display: "block",
                fontSize: "clamp(12px, 4vw, 24px)",
                color: "#e8eaf0",
                letterSpacing: "-0.04em",
                textTransform: "uppercase" as const,
                paddingLeft: "clamp(16px, 3vw, 48px)",
              }}
            >
              THE TRUTH RELEASES{" "}
              <span
                style={{
                  color: "#FFFFFF",
                  textDecoration: "underline",
                  textDecorationColor: "#22C55E",
                  textUnderlineOffset: "6px",
                  textDecorationThickness: "2px",
                }}
              >
                ITSELF.
              </span>
            </motion.span>
          </h1>

          {/* ── Subheadline ── */}
          <motion.p
            className="ec-mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.7}
            style={{
              fontSize: "13px",
              lineHeight: 1.85,
              color: "rgba(74,85,104,0.85)",
              maxWidth: "520px",
              fontWeight: 400,
              marginBottom: "48px",
            }}
          >
            A cryptographically guaranteed trigger on Solana. Arm it once. Check
            in to stay silent. Miss a window — and everything publishes. No
            override. No negotiation. No mercy.
          </motion.p>

          {/* ── Metadata row ── */}
          <motion.div
            className="ec-mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.9}
            style={{
              display: "flex",
              flexWrap: "wrap" as const,
              justifyContent: "center",
              gap: "8px 28px",
              fontSize: "10px",
              fontWeight: 400,
              letterSpacing: "0.12em",
              color: "rgba(74,85,104,0.7)",
              textTransform: "uppercase" as const,
              marginBottom: "56px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={10} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              72H TIMELOCK
            </span>
            <span style={{ color: "rgba(74,85,104,0.2)" }}>·</span>
            <span>SHAMIR SSS 3-OF-5</span>
            <span style={{ color: "rgba(74,85,104,0.2)" }}>·</span>
            <span>IPFS + ARWEAVE</span>
            <span style={{ color: "rgba(74,85,104,0.2)" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Eye size={10} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              KEEPER NETWORK
            </span>
          </motion.div>

          {/* ── CTAs ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1.1}
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap" as const,
              justifyContent: "center",
            }}
          >
            <button
              className="ec-cta-primary ec-mono"
              style={{
                background: "#22C55E",
                color: "#080a0f",
                border: "none",
                borderRadius: "0",
                padding: "13px 30px",
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase" as const,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              LAUNCH APP
              <span className="ec-arrow">
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            </button>

            <button
              className="ec-cta-secondary ec-mono"
              style={{
                background: "transparent",
                color: "rgba(156,163,175,0.7)",
                border: "1px solid #2a3040",
                borderRadius: "0",
                padding: "13px 30px",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                cursor: "pointer",
              }}
            >
              READ WHITEPAPER
            </button>
          </motion.div>

          {/* ── Footer micro-text ── */}
          <motion.p
            className="ec-mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1.3}
            style={{
              fontSize: "10px",
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "rgba(74,85,104,0.45)",
              marginTop: "72px",
            }}
          >
            Audited by Trail of Bits · Built on Solana · Open Source
          </motion.p>
        </div>

        {/* ── Bottom border line ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.06) 30%, rgba(34,197,94,0.06) 70%, transparent 100%)",
            zIndex: 5,
          }}
        />
      </section>
    </>
  );
}
