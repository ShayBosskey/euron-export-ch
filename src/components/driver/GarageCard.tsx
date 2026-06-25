import type { PendingGarage } from "@/lib/routing"

interface Props {
  garage: PendingGarage
  rank: number
}

const URGENCY: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "Critical", color: "#c8331f", bg: "rgba(200,51,31,0.12)", border: "rgba(200,51,31,0.25)" },
  2: { label: "High",     color: "#e8943a", bg: "rgba(232,148,58,0.12)", border: "rgba(232,148,58,0.25)" },
  3: { label: "Normal",   color: "#27a05a", bg: "rgba(39,160,90,0.12)",  border: "rgba(39,160,90,0.25)" },
}

export default function GarageCard({ garage, rank }: Props) {
  const u = URGENCY[garage.urgency] ?? URGENCY[3]
  const hasGps = garage.lat != null && garage.lng != null

  return (
    <div
      className="rounded-2xl p-4 border flex gap-3 items-start"
      style={{
        background: "var(--eu-surface-dark-elevated)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* Rank badge */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5"
        style={{ background: u.bg, color: u.color, border: `1.5px solid ${u.border}` }}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-sm leading-tight"
            style={{ color: "var(--eu-on-dark)" }}
          >
            {garage.garageName || "Unnamed Garage"}
          </h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: u.bg, color: u.color }}
          >
            {u.label}
          </span>
        </div>

        {garage.address && (
          <p className="text-xs mt-1 truncate" style={{ color: "var(--eu-on-dark-soft)" }}>
            {garage.address}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {garage.requestDate && (
            <span className="text-xs" style={{ color: "var(--eu-muted)" }}>
              {garage.requestDate}
            </span>
          )}
          {hasGps ? (
            <span className="text-xs font-medium" style={{ color: "var(--eu-recycle-green)" }}>
              GPS ready
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--eu-error)" }}>
              No GPS
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
