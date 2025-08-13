import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function EditDisplayName({ user }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load profile (both fields) on mount
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;

      const emailHandle = (user.email || "").split("@")[0];

      if (error) {
        console.error("[profiles] fetch error:", error);
        // fallbacks
        setDisplayName(localStorage.getItem("spotter_name") || emailHandle);
        setUsername(emailHandle);
      } else if (data) {
        setDisplayName(data.display_name || localStorage.getItem("spotter_name") || emailHandle);
        setUsername(data.username || emailHandle);
      } else {
        // no profile row yet
        setDisplayName(localStorage.getItem("spotter_name") || emailHandle);
        setUsername(emailHandle);
      }

      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [user?.id, user?.email]);

  async function save() {
    if (!user?.id) return;
    setSaving(true);

    const cleanDisplay = (displayName || "").trim();
    const cleanUser = (username || "").trim() || (user.email || "").split("@")[0];

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, display_name: cleanDisplay, username: cleanUser },
        { onConflict: "id" }
      )
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("[profiles] save error:", error);
      alert(`Couldn't save name: ${error.message}`);
      return;
    }

    // Persist locally so other parts (like form placeholder) see it
    localStorage.setItem("spotter_name", cleanDisplay || cleanUser);
    // Optional: toast
    console.debug("[profiles] saved ->", data);
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Handle:</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          aria-label="Handle"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Display name:</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          aria-label="Display name"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-3 py-1 rounded border border-[#00bcd4] text-sm"
        title="Save profile"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
