// Floating colored orbs that sit behind the entire app. The glass surfaces
// (cards, header, dialogs) refract these as you scroll, which is what gives
// the macOS 26 "Liquid Glass" material its sense of depth.
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}
