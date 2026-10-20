import { useEffect, useRef, useState } from 'react';
import { createFrameLoader } from '../../lib/frameLoader';
import { FRAME_COUNT, FRAME_HEIGHT, FRAME_WIDTH, frameUrl } from '../../lib/frames';
import type { JourneyListener } from './useJourney';

interface Props {
  subscribe: (listener: JourneyListener) => () => void;
}

/** The walker: a canvas that scrubs through the walk/aging frames. */
export default function Chibi({ subscribe }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bobRef = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bob = bobRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !bob || !ctx) return;

    const loader = createFrameLoader(FRAME_COUNT, frameUrl);
    let target = 0;
    let drawn: number | undefined;

    const draw = () => {
      const index = loader.nearest(target);
      const img = index === undefined ? undefined : loader.get(index);
      if (index === undefined || !img || index === drawn) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawn = index;
      setPainted(true);
    };

    const fitCanvas = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn = undefined;
      draw();
    };

    const offLoad = loader.onLoad(draw);
    const unsubscribe = subscribe(({ frame, moving }) => {
      target = frame;
      canvas.dataset.frame = String(frame);
      bob.dataset.moving = String(moving);
      loader.prioritize(frame);
      draw();
    });
    const resize = new ResizeObserver(fitCanvas);
    resize.observe(canvas);

    return () => {
      offLoad();
      unsubscribe();
      resize.disconnect();
      loader.dispose();
    };
  }, [subscribe]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 -translate-x-1/2"
      style={{ left: 'var(--chibi-x)', bottom: 'calc(var(--ground-h) - var(--chibi-h) * 0.035)' }}
    >
      <div ref={bobRef} className="chibi-bob origin-bottom" data-moving="false">
        <div className="relative" style={{ height: 'var(--chibi-h)', aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}` }}>
          {!painted && <img src={frameUrl(0)} alt="" className="absolute inset-0 size-full" />}
          <canvas ref={canvasRef} data-frame="0" className="absolute inset-0 size-full" />
        </div>
      </div>
      <div
        className="absolute bottom-[-0.6svh] left-1/2 h-[2.4svh] w-[70%] -translate-x-1/2 -z-10"
        style={{ background: 'radial-gradient(ellipse at center, rgb(20 18 16 / 0.22), transparent 70%)' }}
      />
    </div>
  );
}
