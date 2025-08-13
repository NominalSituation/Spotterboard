export default function SightingsList({ sightings }) {
  if (!sightings || sightings.length === 0) {
    return <p>No sightings yet — log one!</p>;
  }

  return (
    <ul>
      {sightings.map((sighting) => {
        // Fallback to "Unknown" if no username
        const username =
          sighting.profiles?.username || 'Unknown';

        return (
          <li key={sighting.id} style={{ marginBottom: '10px' }}>
            ✈ <strong>{sighting.airline}</strong> • {sighting.aircraft}
            <br />
            Flight {sighting.flight_number} • {sighting.location} • spotted by @{username}
            <br />
            <small>
              {new Date(sighting.created_at).toLocaleString()}
            </small>
          </li>
        );
      })}
    </ul>
  );
}
