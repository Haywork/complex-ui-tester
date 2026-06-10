import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "CUIT — The best UI feedback loop for Claude Code";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/**
 * Dynamic OG image for CUIT marketing site.
 *
 * Layout (dark theme, 1200×630):
 *  - Full-bleed dark background (#0a0a0b) with subtle grid lines
 *  - Top-left: BrandMark (orange rounded square + cursor glyph) + "CUIT" label
 *  - Center: Large "CUIT" wordmark + tagline + accent pill
 *  - Bottom-right: speechlab.ai attribution
 *
 * Satori constraints applied throughout:
 *  - Every element with >1 child has display:flex
 *  - No z-index — layering via absolute positioning order
 *  - No display:grid or unsupported CSS
 *
 * Uses the Node.js runtime (default in Next 16) so readFile is available.
 * Geist-Regular.ttf is shipped inside @vercel/og — no external font fetch needed.
 */
export default async function Image() {
  const geistPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"
  );
  const geistData = await readFile(geistPath);

  return new ImageResponse(
    (
      /* Root — full-bleed dark card */
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0a0a0b",
          position: "relative",
          fontFamily: "Geist",
          overflow: "hidden",
        }}
      >
        {/* ── Layer 1: grid overlay ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* ── Layer 2: radial accent glow ── */}
        <div
          style={{
            position: "absolute",
            top: 115,
            left: 250,
            width: 700,
            height: 400,
            borderRadius: "50%",
            display: "flex",
            background:
              "radial-gradient(ellipse at center, rgba(255,93,42,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ── Layer 3: BrandMark — top-left ── */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Orange rounded-square icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "#ff5d2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingLeft: 8,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 4,
            }}
          >
            {/* Cursor block */}
            <div
              style={{
                width: 11,
                height: 28,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.95)",
                display: "flex",
              }}
            />
            {/* Dot stack */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  display: "flex",
                }}
              />
              <div
                style={{
                  width: 11,
                  height: 7,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.4)",
                  display: "flex",
                }}
              />
            </div>
          </div>

          {/* "CUIT" label beside icon */}
          <div
            style={{
              display: "flex",
              color: "rgba(250,250,247,0.7)",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            CUIT
          </div>
        </div>

        {/* ── Layer 4: Main content — centered ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 80,
            paddingRight: 80,
            gap: 28,
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontWeight: 700,
              color: "#fafaf7",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            CUIT
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#a1a1aa",
              letterSpacing: "-0.01em",
              lineHeight: 1.35,
              textAlign: "center",
            }}
          >
            The best UI feedback loop for Claude Code
          </div>

          {/* Accent pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "rgba(255,93,42,0.15)",
              border: "1px solid rgba(255,93,42,0.4)",
              borderRadius: 100,
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 22,
              paddingRight: 22,
              marginTop: 8,
            }}
          >
            {/* Dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ff5d2a",
                display: "flex",
              }}
            />
            {/* Pill text */}
            <div
              style={{
                display: "flex",
                color: "#ff5d2a",
                fontSize: 18,
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              RECORD · GENERATE · SHIP
            </div>
          </div>
        </div>

        {/* ── Layer 5: speechlab.ai attribution — bottom-right ── */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 60,
            display: "flex",
            color: "#52525b",
            fontSize: 18,
            letterSpacing: "0.02em",
          }}
        >
          speechlab.ai
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: geistData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
