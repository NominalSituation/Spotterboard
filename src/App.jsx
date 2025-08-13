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
  const [view, setView] = useState('all');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

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

  async function updateUsername() {
    const { error } = await supabase.auth.updateUser({
      data: { username: newName }
    });
    if (error) {
      console.error('Error updating username:', error);
    } else {
      setEditingName(false);
      setSession({
        ...session,
        user: {
          ...session.user,
          user_metadata: { ...session.user.user_metadata, username: newName }
        }
      });
    }
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <h1>✈ Spotterboard</h1>
        <div>
          <span>Welcome, @{session.user.user_metadata.username || session.user.email}</span>
          {!editingName ? (
            <button onClick={() => {
              setNewName(session.user.user_metadata.username || '');
              setEditingName(true);
            }}>Edit Name</button>
          ) : (
            <span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button onClick={updateUsername}>Save</button>
              <button onClick={() => setEditingName(false)}>Cancel</button>
            </span>
          )}
        </div>
        <button onClick={() => supabase.auth.signOut()}>Log Out</button>
      </header>

      {/* TICKER */}
      <RecentSightingsTicker speed={40} /> {/* Slowed down */}

      {/* NEW SIGHTING FORM */}
      <section>
        <NewSighting session={session} onSightingAdded={handleNewSighting} />
      </section>

      {/* VIEW TOGGLE */}
      <div className="view-toggle">
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
