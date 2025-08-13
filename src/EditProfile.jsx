import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function EditProfile({ user, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (error) {
        console.warn("No profile yet, creating one...");
        await supabase.from("profiles").insert([{ id: user.id, display_name: "" }]);
      } else {
        setDisplayName(data.display_name || "");
      }
    }
    loadProfile();
  }, [user.id]);

  async function updateProfile(e) {
    e.preventDefault();
    setLoading(true);

    const updates = {
      id: user.id,
      display_name: displayName,
      updated_at: new Date(),
    };

    let { error } = await supabase.from("profiles").upsert(updates);
    setLoading(false);

    if (error) {
      alert("Error updating profile");
      console.error(error);
    } else {
      alert("Profile updated!");
      if (onProfileUpdated) onProfileUpdated(displayName);
    }
  }

  return (
    <form onSubmit={updateProfile} className="mb-4 p-3 border rounded bg-gray-50">
      <label className="block mb-2 font-bold">Display Name</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="border px-3 py-2 w-full mb-2"
        placeholder="Enter your display name"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
