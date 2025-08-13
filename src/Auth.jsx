import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // signup only
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    // quick client-side check
    const uname = username.trim();
    if (!/^[a-z0-9_\.]{3,20}$/i.test(uname)) {
      setErrorMsg('Username must be 3-20 chars, letters/numbers/._ only');
      setLoading(false);
      return;
    }

    // create auth user
    const { data: sign, error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr) {
      setErrorMsg(signErr.message);
      setLoading(false);
      return;
    }

    // if sign-up returns a user immediately, upsert profile now
    const uid = sign.user?.id;
    if (uid) {
      const { error: upErr } = await supabase.from('profiles').upsert(
        { id: uid, username: uname },
        { onConflict: 'id' }
      );
      if (upErr) {
        setErrorMsg(upErr.message);
        setLoading(false);
        return;
      }
    }

    // done – user may need to verify email depending on your project settings
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto p-6 mt-10 border rounded-xl shadow bg-white">
      <h2 className="text-2xl font-bold mb-4">Planespotter Login</h2>

      <div className="mb-3 text-sm">
        <button
          className={`mr-3 ${mode==='login'?'font-bold':''}`}
          onClick={() => setMode('login')}
        >Log In</button>
        <button
          className={`${mode==='signup'?'font-bold':''}`}
          onClick={() => setMode('signup')}
        >Sign Up</button>
      </div>

      <form className="space-y-4" onSubmit={mode==='login' ? handleLogin : handleSignup}>
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Username (3–20 chars, a–z 0–9 . _ )"
            className="w-full border px-3 py-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Working…' : (mode==='login' ? 'Log In' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
}
