export default function DriverLoading() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(180deg, #16191a 0%, #1a1e1f 100%)" }}
    >
      <span
        aria-hidden="true"
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          borderTopColor: "var(--eu-recycle-green)",
        }}
      />
      <span className="sr-only">Loading today&apos;s route…</span>
    </main>
  )
}
