import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import NewSighting from './NewSighting';
import SightingsList from './SightingsList';
import RecentSightingsTicker from './RecentSightingsTicker';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [personalSightings, setPersonalSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // 'all' or 'mine'

  // Load auth state
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

  // Fetch sightings
  useEffect(() => {
    if (session) {
      fetchAllSightings();
      fetchPersonalSightings();
    }
  }, [session]);

  async function fetchAllSightings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all sightings:', error);
    } else {
      setSightings(data);
    }
    setLoading(false);
  }

  async function fetchPersonalSightings() {
    if (!session?.user?.email) return;
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching personal sightings:', error);
    } else {
      setPersonalSightings(data);
    }
  }

  async function handleNewSighting() {
    await fetchAllSightings();
    await fetchPersonalSightings();
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <h1>✈ Spotterboard</h1>
        <p>Welcome, @{session.user.user_metadata.username || session.user.email}</p>
        <button onClick={() => supabase.auth.signOut()}>Log Out</button>
      </header>

      {/* TICKER */}
      <RecentSightingsTicker />

      {/* NEW SIGHTING FORM */}
      <section>
        <NewSighting session={session} onSightingAdded={handleNewSighting} />
      </section>

      {/* VIEW TOGGLE */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setView('all')}>All Sightings</button>
        <button onClick={() => setView('mine')}>My Sightings</button>
      </div>

      {/* SIGHTINGS LIST */}
      {loading ? (
        <p>Loading sightings...</p>
      ) : view === 'all' ? (
        <SightingsList sightings={sightings} />
      ) : (
        <SightingsList sightings={personalSightings} />
      )}
    </div>
  );
}
