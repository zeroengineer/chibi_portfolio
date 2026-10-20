import { useEffect, useRef } from 'react';
import type { JourneyListener } from './useJourney';

export default function ProgressBar({ subscribe }: { subscribe: (listener: JourneyListener) => () => void }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe(({ progress }) => {
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      }),
    [subscribe],
  );

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-(--header-h) z-40 h-(--rail-h) bg-rail">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-accent" />
    </div>
  );
}
