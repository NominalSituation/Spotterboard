export default function SightingsList({ sightings, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!sightings.length) return <p>No sightings yet.</p>;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Recent Sightings</h2>
      <ul>
        {sightings.map((s) => (
          <li key={s.id} className="mb-3 border-b pb-3">
            <div>
              ✈️ <strong>{s.plane_model}</strong> • {s.aircraft_type || "—"}
            </div>
            <div className="text-sm">
              {s.flight_number ? <>Flight {s.flight_number} • </> : null}
              {s.airport} • spotted by @{s.display_name}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(s.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
