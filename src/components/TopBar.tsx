import { PinFlameLogo } from "./icons";

export default function TopBar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-[#141416]/95 px-3 py-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <PinFlameLogo className="h-6 w-6 shrink-0 text-violet-400" />
        <h1 className="truncate text-base font-semibold tracking-wide">{title}</h1>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
