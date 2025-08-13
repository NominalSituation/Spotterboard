import { useState } from "react";
import { supabase } from "./supabaseClient";

const emailHandle = (email) => (email || "").split("@")[0] || "Unknown";

export default function NewSighting({ user, onAdd }) {
  const [airline, setAirline] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [location, setLocation] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    const displayName =
      localStorage.getItem("spotter_name") || emailHandle(user?.email);

    const row = {
      airline: airline.trim(),
      aircraft_type: aircraftType.trim(),
      flight_number: flightNumber.trim() || null,
      location: location.trim(),
      user_email: user?.email || null,
      user_id: user?.id || null,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("sightings")
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("[insert] error:", error);
      alert(`Error submitting sighting:\n${error.message}`);
      return;
    }

    onAdd?.(data || row);
    setAirline("");
    setAircraftType("");
    setFlightNumber("");
    setLocation("");
  };

  return (
    <form onSubmit={submit} className="mb-6">
      <h2 className="text-lg font-bold mb-3">Report New Sighting</h2>

      {/* Inputs row with comfy padding & spacing */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Airline"
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
          className="border rounded px-3 py-2"
          required
          aria-label="Airline"
        />

        <input
          type="text"
          placeholder="Aircraft Type (e.g., A330‑300)"
          value={aircraftType}
          onChange={(e) => setAircraftType(e.target.value)}
          className="border rounded px-3 py-2"
          required
          aria-label="Aircraft Type"
        />

        <input
          type="text"
          placeholder="Flight Number (optional)"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          className="border rounded px-3 py-2"
          aria-label="Flight Number"
        />

        <input
          type="text"
          placeholder="Location (e.g., KIAD)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border rounded px-3 py-2"
          required
          aria-label="Location"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          title="Submit sighting"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
