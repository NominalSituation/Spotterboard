import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function RecentSightingsTicker() {
  const [sightings, setSightings] = useState([]);

  useEffect(() => {
    fetchRecentSightings();
  }, []);

  async function fetchRecentSightings() {
    const { data, error } = await supabase
      .from("sightings")
      .select("airline, aircraft, flight_number, location, created_at")
      .order("created_at", { ascending: false }) // newest first
      .limit(20); // only last 20

    if (error) {
      console.error("Error fetching sightings:", error);
    } else {
      setSightings(data);
    }
  }

  return (
    <div className="ticker">
      <span>
        {sightings.map((sighting, index) => (
          <span key={index}>
            ✈ {sighting.airline} • {sighting.aircraft} — Flight{" "}
            {sighting.flight_number} @ {sighting.location}{" "}
            ({new Date(sighting.created_at).toLocaleString()}){" "}
            {index < sightings.length - 1 && " • "}
          </span>
        ))}
      </span>
    </div>
  );
}
