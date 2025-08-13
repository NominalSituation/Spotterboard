import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import NewSighting from './NewSighting';
import SightingsList from './SightingsList';
import RetroHeader from './RetroHeader';

export default function App() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sightings
  async function fetchSightings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sightings')
      .select(`
        id,
        airline,
        aircraft,
        flight_number,
        location,
        created_at,
        user_id,
        profiles(username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sightings:', error);
    } else {
      setSightings(data);
    }
    setLoading(false);
  }

  // Handle auth session + username creation
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        let currentUsername = session.user.user_metadata?.username;

        // Auto-generate username if missing
        if (!currentUsername) {
          const emailPrefix = session.user.email.split('@')[0];
          currentUsername = emailPrefix;

          await supabase.auth.updateUser({
            data: { username: currentUsername }
          });
        }

        setUsername(currentUsername);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          let currentUsername = session.user.user_metadata?.username;
          if (!currentUsername) {
            const emailPrefix = session.user.email.split('@')[0];
            currentUsername = emailPrefix;

            await supabase.auth.updateUser({
              data: { username: currentUsername }
            });
          }
          setUsername(currentUsername);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchSightings();
  }, [session]);

  // Log out
  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setUsername('');
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '10px' }}>
      <RetroHeader />

      {!session ? (
        <Auth />
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            <h3>
              Welcome, @{username}{' '}
              <button
                onClick={async () => {
                  const newUsername = prompt('Enter a new username:', username);
                  if (newUsername && newUsername.trim() !== '') {
                    await supabase.auth.updateUser({
                      data: { username: newUsername.trim() }
                    });
                    setUsername(newUsername.trim());
                  }
                }}
              >
                Edit Name
              </button>
            </h3>
            <button onClick={handleLogout}>Log Out</button>
          </div>

          <div style={{ backgroundColor: '#faf7e8', padding: '10px', borderRadius: '4px' }}>
            <h4>Report New Sighting</h4>
            <NewSighting session={session} onSightingAdded={fetchSightings} />
          </div>

          <h4>Recent Sightings</h4>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <SightingsList sightings={sightings} />
          )}
        </>
      )}
    </div>
  );
}
