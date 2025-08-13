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
  return (
    row.display_name ||
    (row.user_email || sessionEmail || "").split("@")[0] ||
    "Unknown"
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  const [mySightings, setMySightings] = useState([]);
  const [allSightings, setAllSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mine'

  // ===== Auth bootstrap =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) refreshFeeds(session.user.email);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
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
    const { data, error } = await supabase
      .from("sightings")
      .select(SELECT_FIELDS)
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
    const { data, error } = await supabase
      .from("sightings")
      .select(SELECT_FIELDS)
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
          setAllSightings((prev) => [payload.new, ...prev].slice(0, 100));
          if (session?.user?.email && payload.new.user_email === session.user.email) {
            setMySightings((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.email]);

  // ===== Top-spotter shout-out =====
  const [topLine, setTopLine] = useState(null);

  async function fetchTopShout() {
    const { data, error } = await supabase
      .from("leaderboard_30d")
      .select("handle, sightings")
      .order("sightings", { ascending: false })
      .limit(1);
    if (error) {
      console.error("[top-spotter] fetch error:", error);
      return null;
    }
    if (!data || !data[0]) return null;
    const { handle, sightings } = data[0];
    return `🏆 Top spotter: @${handle} — ${sightings} in 30d`;
  }

  useEffect(() => {
    let alive = true;
    async function loadTop() {
      const line = await fetchTopShout();
      if (alive) setTopLine(line);
    }
    loadTop();
    const id = setInterval(loadTop, 5 * 60 * 1000); // refresh every 5min
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // ===== Marquee (prepend the shout-out) =====
  const marqueeItems = useMemo(() => {
    const rows = allSightings.slice(0, 10);
    const lines = rows.map((s) => {
      const who = handleFromRow(s, session?.user?.email);
      const airline = s.airline || "Unknown Airline";
      const type = s.aircraft_type || "—";
      const apt = s.location || "???";
      return `${airline} • ${type} @ ${apt} • by @${who}`;
    });
    return topLine ? [topLine, ...lines] : lines;
  }, [allSightings, session?.user?.email, topLine]);

  return (
    <main
      className="min-h-screen p-4"
      style={{
        background:
          "repeating-linear-gradient(45deg, #f6f6ff, #f6f6ff 14px, #f0faff 14px, #f0faff 28px)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <RetroHeader marqueeItems={marqueeItems} />

        {session ? (
          <div className="bg-white border-2 border-[#80deea] rounded-2xl p-4 shadow-md">
            {/* Welcome + handle + logout */}
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
            <NewSighting
              user={session.user}
              onAdd={(newRow) => {
                setAllSightings((prev) => [newRow, ...prev].slice(0, 100));
                if (newRow.user_email === session.user.email) {
                  setMySightings((prev) => [newRow, ...prev]);
                }
                refreshFeeds(session.user.email);
              }}
            />

            {/* Tabs */}
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

            {/* Main content + sidebar */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: feed */}
              <div className="lg:col-span-2">
                {activeTab === "all" && (
                  <SightingsList sightings={allSightings} loading={loading} />
                )}
                {activeTab === "mine" && (
                  <SightingsList sightings={mySightings} loading={loading} />
                )}
              </div>

              {/* RIGHT: Top Spotter card */}
              <aside className="lg:col-span-1 space-y-6">
                <TopSpotterCard limit={5} />
              </aside>
            </div>
          </div>
        ) : (
          <Auth />
        )}
      </div>
    </main>
  );
}
