import { TimelineFeed } from '~/components/timeline/timeline-feed'
import { LiveStatsBanner } from '~/components/live-stats-banner'

export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <LiveStatsBanner />
      <div>
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <p className="text-sm text-muted-foreground">Recent coding sessions</p>
      </div>
      <TimelineFeed />
    </main>
  )
}
