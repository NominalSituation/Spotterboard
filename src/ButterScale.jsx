import { useState } from 'react';

const BUTTER_SCALE = [
  "1. Average DC-3 landing",
  "2. Seat 11A",
  "3. Brain damage",
  "4. Not butter",
  "5. Meh",
  "6. Margarine",
  "7. Semi-butter",
  "8. Butter",
  "9. A-330",
  "10. 100 50 40 30 20 10",
];

export default function ButterScale() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-2 border-yellow-400 rounded-xl bg-yellow-50 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left font-bold flex justify-between items-center"
      >
        <span role="img" aria-label="butter">🧈</span>
        <span className="ml-2">The Butter Scale Reference</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="mt-3 list-disc list-inside text-sm">
          {BUTTER_SCALE.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
