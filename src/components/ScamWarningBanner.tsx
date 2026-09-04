"use client";

import { AlertTriangleIcon, CloseIcon } from "@/components/icons";

export default function ScamWarningBanner({
  risk,
  reasons,
  onDismiss,
}: {
  risk: "low" | "high";
  reasons: string[];
  onDismiss: () => void;
}) {
  return (
    <div
      className={`mx-3 mt-2 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
        risk === "high"
          ? "border-red-400/40 bg-red-400/10 text-red-200"
          : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
      }`}
    >
      <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {risk === "high" ? "Signaux d'arnaque détectés" : "Vigilance conseillée"}
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
      <button onClick={onDismiss} className="shrink-0 p-0.5 opacity-70 hover:opacity-100">
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
