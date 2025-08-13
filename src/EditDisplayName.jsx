import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function EditDisplayName({ user }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("spotter_name") || "";
    setValue(local);

    async function loadProfile() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data?.display_name) {
        setValue(data.display_name);
        localStorage.setItem("spotter_name", data.display_name);
      }
    }
    loadProfile();
  }, [user?.id]);

  async function save() {
    const trimmed = value.trim();
    localStorage.setItem("spotter_name", trimmed);
    if (user?.id) {
      setSaving(true);
      await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: trimmed }, { onConflict: "id" });
      setSaving(false);
    }
    console.debug("[name] saved ->", trimmed);
  }

  function promptEdit() {
    const next = window.prompt("Enter your display name:", value || "");
    if (next !== null) setValue(next);
  }

  const fallback = (user?.email || "").split("@")[0];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">
        Handle: <span className="font-semibold">@{value || fallback}</span>
      </span>
      <button type="button" onClick={promptEdit} className="underline text-[#007c91] text-sm">
        Edit Name
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-2 py-1 rounded border border-[#00bcd4] text-sm"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
