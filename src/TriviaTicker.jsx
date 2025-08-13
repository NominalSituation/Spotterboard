import { useEffect, useMemo, useState } from 'react';

const DEFAULT_FACTS = [
  "The Wright brothers’ first flight in 1903 lasted 12 seconds.",
  "The Boeing 747 has about 6 million parts.",
  "ATC uses ‘squawk’ codes to identify aircraft on radar.",
  "Flaps increase lift at lower speeds for takeoff/landing.",
  "Contrails form when engine exhaust meets cold, humid air.",
  "The Black Box is actually bright orange for visibility.",
  "Commercial jets typically cruise around 35,000 feet.",
  "The ICAO alphabet uses ‘Juliett’ with two t’s.",
  "‘Heavy’ call signs indicate higher wake turbulence.",
  "Runways are numbered by their magnetic heading (°/10).",
  "ETOPS lets twins fly long oceanic routes safely.",
  "Airbus A380’s wingspan is roughly 80 meters (~262 ft).",
  "V1 is the decision speed during takeoff roll.",
  "ILS can guide aircraft to near‑zero visibility landings.",
  "Pressurization keeps cabin altitude far below cruise altitude.",
];
<TriviaTicker facts={["The airbus A330 is considered the Butter Machine",
  "If you are seeing this, then have a very nominal day!",]} />

export default function TriviaTicker({
  facts = DEFAULT_FACTS,
  intervalMs = 8000,
}) {
  // Shuffle once per mount for variety
  const shuffled = useMemo(() => {
    return [...facts].sort(() => Math.random() - 0.5);
  }, [facts]);

  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setI((n) => (n + 1) % shuffled.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, shuffled.length]);

  return (
    <div className="mt-1 text-xs md:text-sm italic opacity-85 select-none">
      <span className="mr-1" role="img" aria-label="light bulb">💡</span>
      <span className="animate-fade">{shuffled[i]}</span>

      <style>{`
        .animate-fade {
          animation: fadeInOut ${Math.max(intervalMs - 500, 1000)}ms ease-in-out;
        }
        @keyframes fadeInOut {
          0% { opacity: 0 }
          10% { opacity: 1 }
          90% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
}
