/**
 * Loads and decodes frames in order of distance from the frame the walker is
 * currently on, so whatever the visitor scrolls to next is ready first.
 */
export function createFrameLoader(count: number, urlFor: (index: number) => string, concurrency = 6) {
  const images: (HTMLImageElement | undefined)[] = new Array(count);
  const requested = new Uint8Array(count);
  const listeners = new Set<() => void>();
  let focus = 0;
  let inFlight = 0;
  let disposed = false;

  function nextIndex() {
    for (let d = 0; d < count; d++) {
      for (const i of [focus + d, focus - d]) {
        if (i >= 0 && i < count && !requested[i]) return i;
      }
    }
    return -1;
  }

  function pump() {
    while (!disposed && inFlight < concurrency) {
      const i = nextIndex();
      if (i < 0) return;
      requested[i] = 1;
      inFlight++;
      const img = new Image();
      img.decoding = 'async';
      img.src = urlFor(i);
      img
        .decode()
        .then(() => {
          images[i] = img;
        })
        .catch(() => {
          requested[i] = 0; // let a later pump retry it
        })
        .finally(() => {
          inFlight--;
          if (disposed) return;
          listeners.forEach((l) => l());
          pump();
        });
    }
  }

  pump();

  return {
    prioritize(index: number) {
      focus = index;
      pump();
    },
    /** The loaded frame closest to `index`, if any frame is loaded yet. */
    nearest(index: number) {
      for (let d = 0; d < count; d++) {
        if (images[index - d]) return index - d;
        if (images[index + d]) return index + d;
      }
      return undefined;
    },
    get: (index: number) => images[index],
    onLoad(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      listeners.clear();
    },
  };
}
