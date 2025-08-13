import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function RecentSightingsTicker({ intervalMs = 8000 }) {
  const [sightings, setSightings] = useState([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    async function fetchSightings() {
      const { data, error } = await supabase
        .from("sightings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) setSightings(data);
    }

    fetchSightings();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setI((n) => (n + 1) % sightings.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, sightings.length]);

  if (sightings.length === 0) return null;

  const current = sightings[i];

  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", background: "transparent" }}>
      <div
        style={{
          display: "inline-block",
          paddingLeft: "100%",
          animation: `scroll-left ${intervalMs}ms linear infinite`,
        }}
      >
        ✈ {current.airline} • {current.aircraft_type} @ {current.airport}
      </div>

      <style>
        {`
          @keyframes scroll-left {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
    </div>
  );
}
