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

  // profile for greeting (display_name)
  const [profile, setProfile] = useState(null);

  const [mySightings, setMySightings] = useState([]);
  const [allSightings, setAllSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mine'

  // ===== Auth bootstrap =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        refreshFeeds(session.user.email);
        fetchMyProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
        setSession(newSession);
        if (newSession) {
          refreshFeeds(newSession.user.email);
          fetchMyProfile(newSession.user.id);
        } else {
          setMySightings([]);
          setAllSightings([]);
          setProfile(null);
        }
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ===== Profile (display_name) =====
  async function fetchMyProfile(userId) {
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[profile] fetch error:", error);
      setProfile(null);
      return;
    }
    setProfile(data || null);
  }

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
    const [all, mine] = await Promise.all([
      fetchAllSightings(),
      fetchMySightings(email),
    ]);
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
          if (
            session?.user?.email &&
            payload.new.user_email === session.user.email
          ) {
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

  // ===== Greeting text uses display_name =====
  const greeting =
    (profile?.display_name && `Welcome, ${profile.display_name}`) ||
    (session?.user?.email && `Welcome, ${session.user.email}`) ||
    "Welcome";

  return (
    <main
      className="min-h-screen p-4"
      style={{
        background:
          "repeating-linear-gradient(45deg, #f6f6ff, #f6f6ff 14px, #f0faff 14px, #f0faff 28px)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <RetroHeader marqueeItems={marqueeItems} />

        {session ? (
          <div className="bg-white border-2 border-[#80deea] rounded-2xl p-4 shadow-md">
            {/* Welcome + display name + logout */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">{greeting}</h1>
              <div className="flex items-center gap-3">
                <EditDisplayName
                  user={session.user}
                  onSaved={(p) =>
                    setProfile((old) => ({ ...(old || {}), ...(p || {}) }))
                  }
                />
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
                  activeTab === "all"
                    ? "bg-[#00bcd4] text-white"
                    : "bg-white text-[#007c91]"
                }`}
                title="See everyone’s sightings"
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
                title="Just yours"
              >
                👤 My Sightings
              </button>
            </div>

            {/* MAIN AREA: left feed + right leaderboard */}
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
          </div>
        ) : (
          <Auth />
        )}
      </div>
    </main>
  );
}
