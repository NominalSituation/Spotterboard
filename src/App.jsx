import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

/** UTIL: pull a friendly display name */
function useDisplayName(session) {
  const [name, setName] = useState(localStorage.getItem("spotter_name") || "");

  // try to load from a profiles table if you have one; otherwise we fall back to localStorage
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error && data?.display_name && isMounted) {
        setName(data.display_name);
        localStorage.setItem("spotter_name", data.display_name);
      }
    }
    load();
    return () => (isMounted = false);
  }, [session?.user?.id]);

  const save = async (newName) => {
    setName(newName);
    localStorage.setItem("spotter_name", newName);

    if (session?.user?.id) {
      // Safe upsert if you have a profiles table (id UUID = auth uid)
      await supabase.from("profiles").upsert(
        { id: session.user.id, display_name: newName },
        { onConflict: "id" }
      );
    }
  };

  return { name, setName: save };
}

/** Header ticker: last 20 sightings */
function Ticker({ items }) {
  const text = useMemo(() => {
    if (!items?.length) return "No sightings yet — log one!";
    return items
      .map((s) => {
        const when = new Date(s.created_at);
        const stamp = when.toLocaleString();
        const airline = s.airline || "Unknown Airline";
        const aircraft = s.aircraft || s.aircraft_type || "Unknown Aircraft";
        const fn = s.flight_number ? ` • ${s.flight_number}` : "";
        const loc = s.location ? ` • ${s.location}` : "";
        const by = s.display_name || s.username || s.user_name || "Unknown";
        return `✈ ${airline} • ${aircraft}${fn}${loc} • spotted by @${by} • ${stamp}`;
      })
      .join(" — ");
  }, [items]);

  return (
    <div className="ticker-rail">
      <div className="ticker-track" aria-live="polite">
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);

  // UI state
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'mine'
  const [sightings, setSightings] = useState([]);
  const [tickerSightings, setTickerSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  // new sighting form
  const [form, setForm] = useState({
    airline: "",
    aircraft: "",
    flight_number: "",
    location: "",
  });

  // display name
  const { name, setName } = useDisplayName(session);
  const userEmail = session?.user?.email || null;
  const userId = session?.user?.id || null;

  // auth mount
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // fetch sightings (for list) with filterMode
  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      let query = supabase
        .from("sightings")
        .select(
          "id, airline, aircraft, aircraft_type, flight_number, location, created_at, user_email, user_id, display_name, username, user_name"
        )
        .order("created_at", { ascending: false });

      if (filterMode === "mine" && userEmail) {
        query = query.eq("user_email", userEmail);
      }

      const { data, error } = await query.limit(200);

      if (!active) return;
      if (error) {
        console.error("Error fetching sightings:", error);
        setSightings([]);
      } else {
        setSightings(data || []);
      }
      setLoading(false);
    }

    run();
    // re-run when userEmail is known so "My" filter works after login resolves
  }, [filterMode, userEmail]);

  // fetch last 20 sightings for the ticker (always global)
  useEffect(() => {
    let cancelled = false;
    async function loadTicker() {
      const { data, error } = await supabase
        .from("sightings")
        .select(
          "airline, aircraft, aircraft_type, flight_number, location, created_at, display_name, username, user_name"
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (!cancelled) {
        if (error) {
          console.error(error);
          setTickerSightings([]);
        } else {
          setTickerSightings(data || []);
        }
      }
    }
    loadTicker();

    // optional: realtime insert subscription to keep ticker fresh
    const channel = supabase
      .channel("sightings-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sightings" },
        (payload) => {
          setTickerSightings((prev) => [payload.new, ...prev].slice(0, 20));
          setSightings((prev) =>
            filterMode === "mine" && userEmail && payload.new.user_email !== userEmail
              ? prev
              : [payload.new, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [filterMode, userEmail]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) {
      alert("Please log in to submit a sighting.");
      return;
    }

    const payload = {
      airline: form.airline?.trim() || null,
      aircraft: form.aircraft?.trim() || null,
      flight_number: form.flight_number?.trim() || null,
      location: form.location?.trim() || null,
      user_email: userEmail,
      user_id: userId,
      display_name: name || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("sightings").insert(payload);
    if (error) {
      console.error(error);
      alert("Failed to submit sighting.");
    } else {
      setForm({ airline: "", aircraft: "", flight_number: "", location: "" });
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function promptEditName() {
    const newName = window.prompt("Enter your display name:", name || "");
    if (newName !== null) {
      setName(newName.trim());
    }
  }

  return (
    <div className="page">
      {/* Retro header */}
      <header className="header">
        <div className="header-inner">
          <span className="logo">✈</span>
          <h1 className="brand">Spotterboard</h1>
          <div className="spacer" />
          {session ? (
            <button className="btn small" onClick={handleLogout}>
              Log Out
            </button>
          ) : null}
        </div>

        {/* slow-moving ticker */}
        <Ticker items={tickerSightings} />
      </header>

      {/* Welcome row */}
      <div className="welcome-row">
        <div className="welcome-left">
          <span>
            Welcome{session?.user?.email ? `, @${session.user.email}` : ""}.
          </span>
          <button className="linklike" onClick={promptEditName}>
            Edit Name
          </button>
        </div>
      </div>

      {/* Report box */}
      <section className="report-box">
        <h2 className="section-title">Report New Sighting</h2>
        <form className="report-form" onSubmit={handleSubmit}>
          <input
            className="field"
            placeholder="Airline"
            value={form.airline}
            onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))}
          />
          <input
            className="field"
            placeholder="Aircraft"
            value={form.aircraft}
            onChange={(e) => setForm((f) => ({ ...f, aircraft: e.target.value }))}
          />
          <input
            className="field"
            placeholder="Flight Number"
            value={form.flight_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, flight_number: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <button className="btn" type="submit">
            Submit
          </button>
        </form>
      </section>

      {/* Filters */}
      <div className="filters">
        <button
          className={`tab ${filterMode === "all" ? "active" : ""}`}
          onClick={() => setFilterMode("all")}
        >
          All Sightings
        </button>
        <button
          className={`tab ${filterMode === "mine" ? "active" : ""}`}
          onClick={() => setFilterMode("mine")}
        >
          My Sightings
        </button>
      </div>

      {/* Recent sightings */}
      <section className="recent">
        <h2 className="section-title">Recent Sightings</h2>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : !sightings.length ? (
          <div className="muted">No sightings yet.</div>
        ) : (
          <ul className="sighting-list">
            {sightings.map((s) => {
              const when = new Date(s.created_at);
              const stamp = when.toLocaleString();
              const airline = s.airline || "Unknown Airline";
              const aircraft = s.aircraft || s.aircraft_type || "Unknown Aircraft";
              const fn = s.flight_number ? ` • ${s.flight_number}` : "";
              const loc = s.location ? ` • ${s.location}` : "";
              const by = s.display_name || s.username || s.user_name || "Unknown";

              return (
                <li key={s.id} className="sighting-item">
                  <div className="bullet">✈</div>
                  <div className="sighting-lines">
                    <div className="line-1">
                      <strong>{airline}</strong> • {aircraft}
                      {fn}
                    </div>
                    <div className="line-2">
                      {loc ? <span>{loc} • </span> : null}
                      <span>spotted by @{by}</span>
                    </div>
                    <div className="line-3">{stamp}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
