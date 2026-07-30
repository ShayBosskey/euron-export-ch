export default function DashboardLoading() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #16191a 0%, #23272a 100%)" }}
    >
      <span
        aria-hidden="true"
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          borderTopColor: "var(--eu-recycle-green)",
        }}
      />
      <span className="sr-only">Loading dashboard…</span>
    </main>
  )
}
