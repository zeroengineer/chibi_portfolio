import manifest from '../data/frames.json';

export const FRAME_COUNT = manifest.count;
export const FRAME_WIDTH = manifest.width;
export const FRAME_HEIGHT = manifest.height;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const frameUrl = (index: number) => `${base}/frames/f${String(index).padStart(3, '0')}.${manifest.ext}`;
