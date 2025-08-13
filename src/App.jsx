import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import NewSighting from "./NewSighting";
import SightingsList from "./SightingsList";

function App() {
  const [session, setSession] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchSightings() {
    setLoading(true);

    let query = supabase.from("sightings").select("*").order("created_at", {
      ascending: false,
    });

    if (filter === "mine" && session?.user) {
      query = query.eq("user_id", session.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching sightings:", error);
    } else {
      setSightings(data);
    }

    setLoading(false);
  }

  // Fetch sightings on load and when filter changes
  useEffect(() => {
    if (session) {
      fetchSightings();
    }
  }, [session, filter]);

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Welcome, @{session.user.user_metadata?.display_name || "User"}</h2>
      <button onClick={() => supabase.auth.signOut()}>Log Out</button>

      <h3>Report New Sighting</h3>
      <NewSighting session={session} onSightingAdded={fetchSightings} />

      <div style={{ margin: "1rem 0" }}>
        <button onClick={() => setFilter("all")}>All Sightings</button>
        <button onClick={() => setFilter("mine")}>My Sightings</button>
      </div>

      <h3>Recent Sightings</h3>
      {loading ? (
        <p>Loading sightings...</p>
      ) : (
        <SightingsList sightings={sightings} />
      )}
    </div>
  );
}

export default App;
