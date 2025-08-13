import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function TopSpotterCard({ limit = 5 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leaderboard_30d")
        .select("user_id, handle, sightings")
        .order("sightings", { ascending: false })
        .limit(limit);

      if (!alive) return;
      if (error) {
        console.error("[leaderboard_30d] error:", error);
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [limit]);

  return (
    <section className="border-2 border-[#80deea] rounded-2xl p-4 bg-white shadow-md">
      <h3 className="text-lg font-bold mb-3">🏆 Top Spotter (30 days)</h3>

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No data yet.</div>
      ) : (
        <ol className="list-decimal ml-6">
          {rows.map((r, i) => (
            <li key={r.user_id} className="mb-2">
              <span className="font-semibold">@{r.handle}</span>{" "}
              <span className="text-gray-700">
                — {r.sightings} sighting{Number(r.sightings) === 1 ? "" : "s"}
              </span>
              {i === 0 && <span className="ml-2">🥇</span>}
              {i === 1 && <span className="ml-2">🥈</span>}
              {i === 2 && <span className="ml-2">🥉</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
