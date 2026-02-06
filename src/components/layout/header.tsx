import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 items-center justify-between border-b px-6 backdrop-blur">
      <h2 className="text-lg font-semibold">Realtime Collab Dashboard</h2>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
