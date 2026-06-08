/** Full-screen centered loading state, shared by dashboard + editor pages. */
export function PageLoading({ label = "Chargement..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <p style={{ color: "var(--fg-muted)" }}>{label}</p>
    </div>
  );
}
