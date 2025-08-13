import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function NewSighting({ session, onSightingAdded }) {
  const [airline, setAirline] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitSighting(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("sightings").insert([
        {
          airline,
          aircraft,
          flight_number: flightNumber,
          location,
          user_id: session.user.id, // Important for RLS
        },
      ]);

      if (error) throw error;

      // Reset form fields
      setAirline("");
      setAircraft("");
      setFlightNumber("");
      setLocation("");

      if (onSightingAdded) {
        onSightingAdded();
      }
    } catch (error) {
      console.error("Error submitting sighting:", error.message);
      alert("Failed to submit sighting: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitSighting} style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Airline"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Aircraft"
        value={aircraft}
        onChange={(e) => setAircraft(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Flight Number"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

