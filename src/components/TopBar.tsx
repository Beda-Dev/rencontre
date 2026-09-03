import { PinFlameLogo } from "./icons";

export default function TopBar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#141416]/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <PinFlameLogo className="h-6 w-6 text-amber-400" />
        <h1 className="text-base font-semibold tracking-wide">{title}</h1>
      </div>
      {right}
    </header>
  );
}
