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
  const [view, setView] = useState('all');
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.username) {
        setUsername(session.user.user_metadata.username);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.username) {
        setUsername(session.user.user_metadata.username);
      }
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

  async function saveUsername() {
    if (!username.trim()) return;
    const { error } = await supabase.auth.updateUser({
      data: { username: username.trim() },
    });
    if (!error) {
      setEditingUsername(false);
    } else {
      console.error(error);
    }
  }

  if (!session) {
    return (
      <div className="retro-container">
        <RetroHeader />
        <Auth />
      </div>
    );
  }

  return (
    <div className="retro-container" style={{ fontFamily: 'monospace', padding: '1rem' }}>
      <RetroHeader />

      <div style={{ marginBottom: '1rem' }}>
        <h2>
          Welcome,{' '}
          {editingUsername ? (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button onClick={saveUsername}>Save</button>
            </>
          ) : (
            <>
              @{username || session.user.email}{' '}
              <button onClick={() => setEditingUsername(true)}>Edit Name</button>
            </>
          )}
        </h2>
        <button onClick={handleSignOut}>Log Out</button>
      </div>

      <div style={{ background: '#f5f5dc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Report New Sighting</h3>
        <NewSighting session={session} onSightingAdded={fetchSightings} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
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
