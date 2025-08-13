export default function RetroHeader({ marqueeItems = [] }) {
  return (
    <header className="relative mb-6 border-4 border-[#00bcd4] rounded-2xl shadow-[0_0_15px_rgba(0,188,212,0.7)] overflow-hidden">
      {/* Banner */}
      <div
        className="p-5 text-center"
        style={{
          background:
            "linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
          imageRendering: "pixelated",
        }}
      >
        <h1 className="text-3xl font-black tracking-wide drop-shadow-sm">
          ✈️ Spotterboard
        </h1>
      </div>

      {/* Marquee bar (single line) */}
      <div className="bg-[#fff8e1] border-t border-[#ffd54f] py-1 overflow-hidden">
        {/* rail enforces single line; track scrolls */}
        <div
          className="w-full"
          style={{
            whiteSpace: "nowrap",        // <- force one line
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "inline-block",   // <- track must be inline-block
              whiteSpace: "nowrap",
              willChange: "transform",
              animation: "scroll-left 18s linear infinite",
            }}
          >
            {marqueeItems.length ? (
              marqueeItems.map((msg, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block", // <- each item stays inline
                    padding: "0 1.5rem",     // spacing between items
                  }}
                >
                  🛫 {msg}
                </span>
              ))
            ) : (
              <>
                <span style={{ display: "inline-block", padding: "0 1.5rem" }}>
                  🌤️ Welcome to the public sightings feed!
                </span>
                <span style={{ display: "inline-block", padding: "0 1.5rem" }}>
                  🛰️ Tip: Add the airport code and model.
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </header>
  );
}
