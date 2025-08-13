import { useState } from "react";
import { supabase } from "./supabaseClient";

function emailHandle(email) {
  return (email || "").split("@")[0] || "Unknown";
}

export default function NewSighting({ user, onAdd }) {
  const [airline, setAirline] = useState("");
  const [airport, setAirport] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [flightNumber, setFlightNumber] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const displayName = localStorage.getItem("spotter_name") || emailHandle(user?.email);

    const row = {
      plane_model: airline.trim(),
      airport: airport.trim(),
      user_email: user?.email || null,
      user_id: user?.id || null,
      display_name: displayName,
      aircraft_type: aircraftType.trim(),
      flight_number: flightNumber.trim() || null,
    };

    console.debug("[insert] row ->", row);

    const { error } = await supabase.from("sightings").insert([row]);

    if (error) {
      console.error("[insert] error:", error);
      alert("Error submitting sighting");
    } else {
      onAdd?.();
      setAirline("");
      setAirport("");
      setAircraftType("");
      setFlightNumber("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
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
        placeholder="Aircraft Type (e.g., A320, 737‑800)"
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
        placeholder="Airport (e.g., KORD)"
        value={airport}
        onChange={(e) => setAirport(e.target.value)}
        className="border px-4 py-2 mr-2 mb-2"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit
      </button>
    </form>
  );
}
