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

    const displayName = localStorage.getItem("spotter_name") || emailHandle(user?.email);

    const row = {
      airline: airline.trim(),
      aircraft_type: aircraftType.trim(),
      flight_number: flightNumber.trim() || null,
      location: location.trim(),
      user_email: user?.email || null,
      user_id: user?.id || null, // RLS-friendly
      display_name: displayName,
      created_at: new Date().toISOString(),
    };

    console.debug("[insert] row ->", row);

    const { data, error } = await supabase.from("sightings").insert([row]).select().single();

    if (error) {
      console.error("[insert] error:", error);
      alert(`Error submitting sighting:\n${error.message}`);
      return;
    }

    onAdd?.(data || row); // optimistic handoff
    setAirline("");
    setAircraftType("");
    setFlightNumber("");
    setLocation("");
  };

  return (
    <form onSubmit={submit} className="mb-8">
      <h2 className="text-lg font-bold mb-4">Report New Sighting</h2>

      <input
        type="text"
        placeholder="Airline"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
        className="border px-4 py-2 mr-2 mb-2"
        required
      />
      <input
        type="text"
        placeholder="Aircraft Type (e.g., A330-300)"
        value={aircraftType}
        onChange={(e) => setAircraftType(e.target.value)}
        className="border px-4 py-2 mr-2 mb-2"
        required
      />
      <input
        type="text"
        placeholder="Flight Number (optional)"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
        className="border px-4 py-2 mr-2 mb-2"
      />
      <input
        type="text"
        placeholder="Location (e.g., KIAD)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border px-4 py-2 mr-2 mb-2"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit
      </button>
    </form>
  );
}
