export default function SightingsList({ sightings }) {
  if (!sightings || sightings.length === 0) {
    return <p>No sightings yet — log one!</p>;
  }

  return (
    <ul>
      {sightings.map((sighting) => (
        <li key={sighting.id}>
          ✈ <strong>{sighting.airline}</strong> • {sighting.aircraft_type}
          <br />
          Flight {sighting.flight_number} • {sighting.location}
          <br />
          spotted by @{sighting.profiles?.username || 'Unknown'} on{' '}
          {new Date(sighting.created_at).toLocaleString()}
        </li>
      ))}
    </ul>
  );
}
