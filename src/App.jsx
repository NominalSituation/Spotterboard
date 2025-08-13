import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import NewSighting from "./NewSighting";
import SightingsList from "./SightingsList";
import RetroHeader from "./RetroHeader";

function App() {
  const [session, setSession] = useState(null);
  const [mySightings, setMySightings] = useState([]);
  const [allSightings, setAllSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [profile, setProfile] = useState(null);
  const [savingName, setSavingName] = useState(false);

  // Ensure a profile row exists for the user
  async function ensureProfile(user) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!existing) {
      await supabase.from("profiles").insert([
        { id: user.id, display_name: user.email.split("@")[0] }
      ]);
      setProfile({ id: user.id, display_name: user.email.split("@")[0] });
    } else {
      setProfile(existing);
    }
  }

  async function fetchProfile(user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  }

  async function updateDisplayName(newName) {
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName })
      .eq("id", profile.id);
    if (!error) {
      setProfile((p) => ({ ...p, display_name: newName }));
    } else {
      alert("Error updating profile");
      console.error(error);
    }
    setSavingName(false);
  }

  async function fetchMySightings() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("sightings")
      .select("*")
      .eq("user_email", session.user.email)
      .order("created_at", { ascending: false });
    if (!error) setMySightings(data || []);
  }

  async function fetchAllSightings() {
    const { data, error } = await supabase
      .from("sightings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setAllSightings(data || []);
  }

  async function refreshFeeds() {
    setLoading(true);
    await Promise.all([fetchAllSightings(), fetchMySightings()]);
    setLoading(false);
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await ensureProfile(newSession.user);
          refreshFeeds();
        } else {
          setMySightings([]);
          setAllSightings([]);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await ensureProfile(session.user);
        refreshFeeds();
      } else {
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Build scrolling banner items from recent sightings
  const marqueeItems = (allSightings || [])
    .slice(0, 10)
    .map((s) => {
      const airline = s.plane_model;
      const type = s.aircraft_type || "—";
      const airport = s.airport;
      const user = s.display_name || s.user_email.split("@")[0];
      return `${airline} • ${type} @ ${airport} • @${user}`;
    });

  return (
    <main
      className="min-h-screen p-4"
      style={{
        background:
          "repeating-linear-gradient(45deg, #f6f6ff, #f6f6ff 14px, #f0faff 14px, #f0faff 28px)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <RetroHeader marqueeItems={marqueeItems} />

        {session ? (
          <div className="bg-white border-2 border-[#80deea] rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">
                Welcome, @{profile?.display_name || session.user.email}
              </h1>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Log Out
              </button>
            </div>

            {/* Display Name Edit */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={profile?.display_name || ""}
                onChange={(e) => updateDisplayName(e.target.value)}
                className="border px-3 py-1"
              />
              {savingName && <span className="ml-2 text-sm">Saving...</span>}
            </div>

            <NewSighting user={session.user} onAdd={refreshFeeds} />

            {/* Tabs */}
            <div className="mt-6">
              <div className="inline-flex rounded-full overflow-hidden border-2 border-[#00bcd4] shadow">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 text-sm font-semibold ${
                    activeTab === "all"
                      ? "bg-[#00bcd4] text-white"
                      : "bg-white text-[#007c91]"
                  }`}
                >
                  🌍 All Sightings
                </button>
                <button
                  onClick={() => setActiveTab("mine")}
                  className={`px-4 py-2 text-sm font-semibold ${
                    activeTab === "mine"
                      ? "bg-[#00bcd4] text-white"
                      : "bg-white text-[#007c91]"
                  }`}
                >
                  👤 My Sightings
                </button>
              </div>

              <div className="mt-4">
                {activeTab === "all" ? (
                  <SightingsList sightings={allSightings} loading={loading} />
                ) : (
                  <SightingsList sightings={mySightings} loading={loading} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <Auth />
        )}
      </div>
    </main>
  );
}

export default App;
