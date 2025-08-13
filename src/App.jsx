import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import NewSighting from "./NewSighting";
import SightingsList from "./SightingsList";
import RetroHeader from "./RetroHeader";
import EditDisplayName from "./EditDisplayName";
import TopSpotterCard from "./TopSpotterCard";

const SELECT_FIELDS =
  "id, airline, location, aircraft_type, flight_number, display_name, user_email, user_id, created_at";

function handleFromRow(row, sessionEmail) {
  return row.display_name ||
    (row.user_email || sessionEmail || "").split("@")[0] ||
    "Unknown";
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mySightings, setMySightings] = useState([]);
  const [allSightings, setAllSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Auth bootstrap
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Fetch profile
  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [session]);

  // Fetch sightings
  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase
        .from("sightings")
        .select(SELECT_FIELDS)
        .order("created_at", { ascending: false }),
      supabase
        .from("sightings")
        .select(SELECT_FIELDS)
        .eq("user_email", session.user.email)
        .order("created_at", { ascending: false }),
    ]).then(([allRes, myRes]) => {
      if (allRes.data) setAllSightings(allRes.data);
      if (myRes.data) setMySightings(myRes.data);
      setLoading(false);
    });
  }, [session]);

  if (!session) {
    return (
      <main className="p-4">
        <Auth />
      </main>
    );
  }

  return (
    <main className="p-4">
      <RetroHeader />
      <h1 className="text-2xl font-bold">
        Welcome, {profile?.display_name || "Spotter"}
      </h1>

      <EditDisplayName
        profile={profile}
        setProfile={setProfile}
        session={session}
      />

      <NewSighting session={session} />

      <div className="mt-4 flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT: feed grows */}
        <div className="flex-1 min-w-0">
          {activeTab === "all" && (
            <SightingsList sightings={allSightings} loading={loading} />
          )}
          {activeTab === "mine" && (
            <SightingsList sightings={mySightings} loading={loading} />
          )}
        </div>

        {/* RIGHT: fixed-width sidebar */}
        <aside
          className="w-full lg:w-[320px] shrink-0"
          aria-label="Right sidebar"
        >
          <TopSpotterCard limit={5} />
        </aside>
      </div>
    </main>
  );
}
