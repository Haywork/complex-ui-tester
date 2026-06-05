import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Dynamic favicon — matches the BrandMark component.
 * Rounded orange square with a terminal-cursor block inside.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          backgroundColor: "#ff5d2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: 6,
          paddingTop: 6,
          paddingBottom: 6,
          gap: 3,
        }}
      >
        {/* Solid left block — the "cursor" */}
        <div
          style={{
            width: 8,
            height: 20,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.95)",
          }}
        />
        {/* Right dots */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.65)",
            }}
          />
          <div
            style={{
              width: 8,
              height: 5,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.4)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
