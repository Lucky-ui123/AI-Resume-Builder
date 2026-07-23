'use client';

import { usePathname } from 'next/navigation';
import { useRef } from 'react';

/**
 * PageTransition
 *
 * Wraps page content with a subtle fade + translateY animation that
 * re-triggers every time the route pathname changes.
 *
 * Design choices:
 *  - 150ms duration, ease-out — fast enough to feel instant, slow
 *    enough to look polished.
 *  - 6px translateY — perceptible but never distracting.
 *  - Uses a keyed <div> so React unmounts/remounts the wrapper on
 *    each navigation, guaranteeing the animation replays.
 *  - No Suspense boundary here — per-route loading.tsx files own
 *    the skeleton display; this component only adds the entrance
 *    animation once real content has arrived.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use pathname as the React key so the div remounts on every
  // navigation, replaying the CSS animation automatically.
  return (
    <div key={pathname} className="page-transition-enter flex-1 flex flex-col min-h-0">
      {children}
    </div>
  );
}
