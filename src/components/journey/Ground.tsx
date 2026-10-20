/** The horizon the walker stands on; fixed while the world slides past. */
export default function Ground() {
  return (
    <div aria-hidden="true">
      <div className="absolute inset-x-[-14px] bottom-(--ground-h) z-10 h-[3px] bg-ink [filter:url(#wobble)]" />
      <div className="absolute inset-x-0 bottom-0 z-0 h-(--ground-h) bg-linear-to-b from-ink/6 to-transparent" />
    </div>
  );
}
