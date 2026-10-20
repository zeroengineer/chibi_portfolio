import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { CHAPTERS } from '../../data/chapters';
import { profile } from '../../data/profile';

interface Props {
  activeId: string;
  onNavigate: (id: string) => void;
  onMenuToggle: (open: boolean) => void;
}

export default function Header({ activeId, onNavigate, onMenuToggle }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onMenuToggle(open);
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[aria-current="location"], a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onMenuToggle]);

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    onMenuToggle(false); // unlock scrolling now; unlocking later would cancel the walk below
    onNavigate(id);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-(--header-h) items-center justify-between gap-3 border-b-[2.5px] border-ink bg-paper/92 px-4 backdrop-blur-sm md:px-6">
        <a href="#hero" onClick={go('hero')} className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
          <span className="font-display text-[22px] tracking-[1px] md:text-2xl">{profile.name.toUpperCase()}</span>
          <span className="hidden text-[13px] text-muted italic sm:inline">/ portfolio</span>
        </a>

        <nav aria-label="Chapters" className="hidden items-center gap-1 xl:flex">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              onClick={go(c.id)}
              aria-current={activeId === c.id ? 'location' : undefined}
              className="rounded-lg px-[11px] py-[7px] text-[14.5px] font-semibold transition-colors hover:bg-ink hover:text-paper aria-[current=location]:bg-ink aria-[current=location]:text-paper"
            >
              {c.nav}
            </a>
          ))}
        </nav>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="chapter-menu"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border-[2.5px] border-ink bg-paper px-3 py-1 font-display text-[17px] tracking-[1px] shadow-comic-sm active:translate-x-px active:translate-y-px xl:hidden"
        >
          {open ? 'Close' : 'Chapters'}
          <span aria-hidden="true" className="text-[15px] leading-none">
            {open ? '✕' : '☰'}
          </span>
        </button>
      </header>

      {/* Outside <header>: its backdrop-filter would make it the containing block of this fixed overlay. */}
      {open && (
        <div
          ref={menuRef}
          id="chapter-menu"
          data-lenis-prevent
          className="fixed inset-x-0 top-(--header-h) bottom-0 z-50 overflow-y-auto border-t-[2.5px] border-ink bg-paper xl:hidden"
        >
          <nav aria-label="Chapters" className="mx-auto flex max-w-md flex-col gap-2 px-6 py-6">
            {CHAPTERS.map((c, i) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                onClick={go(c.id)}
                aria-current={activeId === c.id ? 'location' : undefined}
                className="flex items-baseline gap-4 rounded-md border-[2.5px] border-transparent px-3 py-2 font-display text-[28px] tracking-[1px] hover:border-ink aria-[current=location]:border-ink aria-[current=location]:bg-ink aria-[current=location]:text-paper short:py-1 short:text-[22px]"
              >
                <span className="w-8 text-[18px] text-accent">{String(i).padStart(2, '0')}</span>
                {c.nav}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
