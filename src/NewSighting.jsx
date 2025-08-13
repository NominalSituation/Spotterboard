import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function NewSighting({ session, onSightingAdded }) {
  const [airline, setAirline] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('You must be logged in to submit a sighting.');
      return;
    }

    const { data, error } = await supabase
      .from('sightings')
      .insert({
        airline,
        aircraft_type: aircraft, // ✅ matches Supabase column name
        flight_number: flightNumber,
        location,
        user_id: session.user.id
      });

    if (error) {
      console.error('Error inserting sighting:', error);
      alert('Error submitting sighting: ' + error.message);
    } else {
      // Reset form fields
      setAirline("");
      setAircraft("");
      setFlightNumber("");
      setLocation("");

      // Notify parent to refresh sightings
      if (onSightingAdded) onSightingAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Airline"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
      />
      <input
        type="text"
        placeholder="Aircraft Type"
        value={aircraft}
        onChange={(e) => setAircraft(e.target.value)}
      />
      <input
        type="text"
        placeholder="Flight Number"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
