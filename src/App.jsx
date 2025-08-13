import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import NewSighting from './NewSighting';
import SightingsList from './SightingsList';
import RetroHeader from './RetroHeader';

function App() {
  const [session, setSession] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // 'all' or 'mine'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchSightings() {
    setLoading(true);

    let query = supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false });

    if (view === 'mine' && session?.user) {
      query = query.eq('user_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sightings:', error);
    } else {
      setSightings(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (session) {
      fetchSightings();
    }
  }, [session, view]);

  function handleSignOut() {
    supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div>
        <RetroHeader />
        <Auth />
      </div>
    );
  }

  return (
    <div>
      <RetroHeader />

      <h2>
        Welcome, @{session?.user?.user_metadata?.username || session?.user?.email}
      </h2>

      <button onClick={handleSignOut}>Log Out</button>

      <h3>Report New Sighting</h3>
      <NewSighting session={session} onSightingAdded={fetchSightings} />

      <div>
        <button onClick={() => setView('all')}>All Sightings</button>
        <button onClick={() => setView('mine')}>My Sightings</button>
      </div>

      <h3>Recent Sightings</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <SightingsList sightings={sightings} />
      )}
    </div>
  );
}

export default App;
