import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import NewSighting from "./NewSighting";
import SightingsList from "./SightingsList";
import RetroHeader from "./RetroHeader";
import EditDisplayName from "./EditDisplayName";

// Fallback handle builder for rows that may not have display_name
function handleFromRow(row, sessionEmail) {
  return (
    row.display_name ||
    row.username ||
    row.user_name ||
    (row.user_email || sessionEmail || "").split("@")[0] ||
    "Unknown"
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  // Feeds
  const [mySightings, setMySightings] = useState([]);
  const [allSightings, setAllSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: "all" | "mine"
  const [activeTab, setActiveTab] = useState("all");

  // ===== Auth bootstrap =====
  useEffect(() => {
    console.debug("[auth] boot");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.debug("[auth] getSession ->", !!session);
      setSession(session);
      if (session) refreshFeeds(session.user.email);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
        console.debug("[auth] onAuthStateChange ->", !!newSession);
        setSession(newSession);
        if (newSession) refreshFeeds(newSession.user.email);
        else {
          setMySightings([]);
          setAllSightings([]);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ===== Fetchers =====
  async function fetchAllSightings() {
    console.debug("[fetch] all sightings");
    const { data, error } = await supabase
      .from("sightings")
      .select(
        "id, plane_model, airport, aircraft_type, flight_number, display_name, username, user_name, user_email, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("[fetch] all error:", error);
      return [];
    }
    return data || [];
  }

  async function fetchMySightings(email) {
    if (!email) return [];
    console.debug("[fetch] my sightings for", email);
    const { data, error } = await supabase
      .from("sightings")
      .select(
        "id, plane_model, airport, aircraft_type, flight_number, display_name, username, user_name, user_email, created_at"
      )
      .eq("user_email", email)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[fetch] mine error:", error);
      return [];
    }
    return data || [];
  }

  async function refreshFeeds(email) {
    setLoading(true);
    const [all, mine] = await Promise.all([fetchAllSightings(), fetchMySightings(email)]);
    setAllSightings(all);
    setMySightings(mine);
    setLoading(false);
  }

  // ===== Realtime inserts =====
  useEffect(() => {
    const channel = supabase
      .channel("sightings-insert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sightings" },
        (payload) => {
          console.debug("[rt] insert", payload.new);
          setAllSightings((prev) => [payload.new, ...prev].slice(0, 100));
          if (session?.user?.email && payload.new.user_email === session.user.email) {
            setMySightings((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.email]);

  // ===== Build marquee (latest 10 global) =====
  const marqueeItems = useMemo(() => {
    const rows = allSightings.slice(0, 10);
    return rows.map((s) => {
      const who = handleFromRow(s, session?.user?.email);
      const airline = s.plane_model || "Unknown Airline";
      const type = s.aircraft_type || "—";
      const apt = s.airport || "???";
      return `${airline} • ${type} @ ${apt} • by @${who}`;
    });
  }, [allSightings, session?.user?.email]);

  // ===== UI =====
  return (
    <main
      className="min-h-screen p-4"
      style={{
        // light retro wallpaper vibe (matches your old look)
        background:
          "repeating-linear-gradient(45deg, #f6f6ff, #f6f6ff 14px, #f0faff 14px, #f0faff 28px)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Original retro header with the scrolling marquee */}
        <RetroHeader marqueeItems={marqueeItems} />

        {session ? (
          <div className="bg-white border-2 border-[#80deea] rounded-2xl p-4 shadow-md">
            {/* Welcome row + Edit Name + Logout */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Welcome, {session.user.email}</h1>
              <div className="flex items-center gap-3">
                <EditDisplayName user={session.user} />
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Report form */}
            <NewSighting user={session.user} onAdd={() => refreshFeeds(session.user.email)} />

            {/* Tabs */}
            <div className="mt-6">
              <div className="inline-flex rounded-full overflow-hidden border-2 border-[#00bcd4] shadow">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 text-sm font-semibold ${
                    activeTab === "all" ? "bg-[#00bcd4] text-white" : "bg-white text-[#007c91]"
                  }`}
                  title="See everyone’s sightings"
                >
                  🌍 All Sightings
                </button>
                <button
                  onClick={() => setActiveTab("mine")}
                  className={`px-4 py-2 text-sm font-semibold ${
                    activeTab === "mine" ? "bg-[#00bcd4] text-white" : "bg-white text-[#007c91]"
                  }`}
                  title="Just yours"
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
