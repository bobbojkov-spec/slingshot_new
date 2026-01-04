export default function Head() {
  // Admin layout invariants:
  // - Never hide horizontal overflow globally (no clipping).
  // - Never enforce global min-width (main content must adapt; tables scroll internally).
  return (
    <>
      <style>{`
        html, body {
          min-width: 0 !important;
          overflow-x: visible !important;
        }
      `}</style>
    </>
  );
}


