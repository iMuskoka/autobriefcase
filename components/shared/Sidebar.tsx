export function Sidebar() {
  return (
    <nav
      aria-label="Fleet navigation"
      className="flex flex-col w-full h-full py-4"
    >
      <div className="px-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your fleet
        </p>
      </div>
      <div className="px-4">
        <p className="text-sm text-muted-foreground">No vehicles yet</p>
      </div>
    </nav>
  );
}
