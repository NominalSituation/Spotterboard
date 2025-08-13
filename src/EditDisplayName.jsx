import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function EditDisplayName({ user, onSaved }) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();

      const emailHandle = (user.email || "").split("@")[0];

      if (!alive) return;
      if (error) {
        console.error("[profiles] fetch error:", error);
        setDisplayName(localStorage.getItem("spotter_name") || emailHandle);
      } else if (data) {
        setDisplayName(data.display_name || data.username || emailHandle);
      } else {
        setDisplayName(localStorage.getItem("spotter_name") || emailHandle);
      }
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [user?.id, user?.email]);

  async function save() {
    if (!user?.id) return;
    const clean = (displayName || "").trim();
    if (!clean) return;

    setSaving(true);
    // Keep username in sync for NOT NULL / legacy places
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, display_name: clean, username: clean },
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

    localStorage.setItem("spotter_name", clean);
    onSaved?.(data); // allow parent to refresh greeting immediately
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-700">Display name:</label>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
        aria-label="Display name"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-3 py-1 rounded border border-[#00bcd4] text-sm"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
