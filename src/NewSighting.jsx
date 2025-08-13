import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function NewSighting({ user, onAdd }) {
  const [airline, setAirline] = useState("");
  const [airport, setAirport] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setDisplayName(data?.display_name || user.email);
    }
    loadProfile();
  }, [user.id, user.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("sightings").insert([
      {
        plane_model: airline,
        airport,
        user_email: user.email,
        aircraft_type: aircraftType,
        flight_number: flightNumber || null,
        display_name: displayName, // Use display name
      },
    ]);

    if (error) {
      alert("Error submitting sighting");
      console.error(error);
    } else {
      if (onAdd) onAdd();
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
        placeholder="Aircraft Type (e.g., A320, 737-800)"
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
