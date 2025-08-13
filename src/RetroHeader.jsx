export default function RetroHeader({ marqueeItems = [] }) {
  // Build one line of inline items with separators
  const items = (marqueeItems || []).length
    ? marqueeItems
    : ["No sightings yet — log one!"];

  return (
    <header className="relative mb-6 border-4 border-[#00bcd4] rounded-2xl shadow-[0_0_15px_rgba(0,188,212,0.7)] overflow-hidden">
      {/* Banner */}
      <div
        className="p-5"
        style={{
          background:
            "linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
          imageRendering: "pixelated",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            minWidth: 0, // allow ticker to take remaining width
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 900,
              textShadow: "1px 1px 0 #fff",
              whiteSpace: "nowrap",
            }}
          >
            ✈ Spotterboard
          </h1>

          {/* Marquee lane (takes all remaining space) */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "inline-block",
                paddingLeft: "100%",
                // Slow crawl; bump to 100s if you want even slower
                animation: "sb-marquee 80s linear infinite",
              }}
            >
              {/* render inline; no wrapping; space between items */}
              {items.map((msg, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline", // force inline (prevents block stacking)
                    whiteSpace: "nowrap",
                    marginRight: "2.5rem",
                  }}
                >
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sb-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </header>
  );
}
