import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import NewSighting from './NewSighting';
import SightingsList from './SightingsList';

export default function App() {
  const [session, setSession] = useState(null);
  const [allSightings, setAllSightings] = useState([]);
  const [mySightings, setMySightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAllSightings();
      fetchMySightings();
    }
  }, [session]);

  async function fetchAllSightings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sightings')
      .select(`
        id,
        airline,
        aircraft_type,
        flight_number,
        location,
        created_at,
        profiles(username)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setAllSightings(data);

    setLoading(false);
  }

  async function fetchMySightings() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('sightings')
      .select(`
        id,
        airline,
        aircraft_type,
        flight_number,
        location,
        created_at,
        profiles(username)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setMySightings(data);
  }

  function handleSightingAdded() {
    fetchAllSightings();
    fetchMySightings();
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div>
      <header style={{ background: 'linear-gradient(to right, #dff, #cff)', padding: '10px' }}>
        <h1>✈ Spotterboard</h1>
        <p>
          Welcome, @{session.user.user_metadata?.username || session.user.email}{' '}
          <button onClick={() => supabase.auth.signOut()}>Log Out</button>
        </p>
      </header>

      <NewSighting session={session} onSightingAdded={handleSightingAdded} />

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setView('all')}>All Sightings</button>
        <button onClick={() => setView('mine')}>My Sightings</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <SightingsList sightings={view === 'all' ? allSightings : mySightings} />
      )}
    </div>
  );
}
