import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function NewSighting({ session, onSightingAdded }) {
  const [airline, setAirline] = useState('');
  const [aircraft, setAircraft] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('You must be logged in to submit a sighting.');
      return;
    }

    const { data, error } = await supabase
      .from('sightings')
      .insert([
        {
          airline,
          aircraft,
          flight_number: flightNumber,
          location,
          user_id: session.user.id // ✅ This matches your RLS policy
        }
      ]);

    if (error) {
      console.error('Error inserting sighting:', error);
      alert('Error submitting sighting: ' + error.message);
    } else {
      setAirline('');
      setAircraft('');
      setFlightNumber('');
      setLocation('');
      if (onSightingAdded) {
        onSightingAdded(data[0]); // Call parent refresh if needed
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit">Submit</button>
    </form>
  );
}
