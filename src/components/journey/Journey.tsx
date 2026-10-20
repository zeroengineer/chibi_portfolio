import type { ReactNode } from 'react';
import Chibi from './Chibi';
import Ground from './Ground';
import Header from './Header';
import ProgressBar from './ProgressBar';
import { useJourney } from './useJourney';

/**
 * The one interactive island. The chapters come in as static HTML children;
 * this component pins them on a stage and walks the character through them.
 */
export default function Journey({ children }: { children: ReactNode }) {
  const { spacerRef, stageRef, trackRef, subscribe, activeId, goTo, setLocked } = useJourney();

  return (
    <>
      <Header activeId={activeId} onNavigate={goTo} onMenuToggle={setLocked} />
      <ProgressBar subscribe={subscribe} />
      <main ref={spacerRef} className="relative">
        <div ref={stageRef} className="stage sticky top-0 h-dvh overflow-hidden">
          <Ground />
          <div ref={trackRef} className="relative flex h-full w-max will-change-transform">
            {children}
          </div>
          <Chibi subscribe={subscribe} />
        </div>
      </main>
    </>
  );
}
