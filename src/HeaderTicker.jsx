import { useMemo } from "react";
import TriviaTicker from "./TriviaTicker";
import RecentSightingsTicker from "./RecentSightingsTicker";

export default function HeaderTicker() {
  // Merge the trivia and recent sightings into one sequence
  const items = useMemo(() => {
    return [
      { type: "trivia" },
      { type: "sighting" },
      { type: "trivia" },
      { type: "sighting" },
    ];
  }, []);

  return (
    <div style={{
      overflow: "hidden",
      whiteSpace: "nowrap",
      flex: 1
    }}>
      <div style={{
        display: "inline-block",
        animation: `scroll-left 60s linear infinite` // slowed to 60 seconds
      }}>
        {items.map((item, idx) => (
          <span key={idx} style={{ marginRight: "4rem" }}>
            {item.type === "trivia" && <TriviaTicker intervalMs={999999} />}
            {item.type === "sighting" && <RecentSightingsTicker intervalMs={999999} />}
          </span>
        ))}
      </div>

      <style>
        {`
          @keyframes scroll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}
