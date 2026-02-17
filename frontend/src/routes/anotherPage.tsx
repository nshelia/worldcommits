import { Link, createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/anotherPage')({
  component: AnotherPage,
})

function AnotherPage() {
  const seedDemoTimeline = useMutation(api.posts.seedDemoTimeline)
  const ingestPromptEventWithRewrite = useAction(
    api.posts.ingestPromptEventWithRewrite,
  )

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5">
      <h1 className="text-2xl font-semibold">Ingest playground</h1>
      <Card className="rounded-2xl">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Create test timeline data</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this page to generate sessions and events quickly.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2">
          <Button
            type="button"
            className="rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            onClick={() => {
              void seedDemoTimeline()
            }}
          >
            Seed demo timeline
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              const now = Date.now()
              void ingestPromptEventWithRewrite({
                sessionId: `manual-${Math.floor(now / 60000)}`,
                githubUsername: 'manual-user',
                timestamp: now,
                promptLength: Math.floor(Math.random() * 80) + 20,
                containsCodeBlock: Math.random() > 0.6,
                modelUsed: 'gpt-5',
                retryIndex: Math.floor(Math.random() * 3),
                timeSinceLastPromptMs: Math.floor(Math.random() * 90000),
                aiEditSuggested: true,
                aiEditAccepted: Math.random() > 0.5,
                manualOverride: Math.random() > 0.5,
                linesAddedCount: Math.floor(Math.random() * 40),
                linesRemovedCount: Math.floor(Math.random() * 20),
                repeatedPatternDetected: Math.random() > 0.65,
                highRetryRate: Math.random() > 0.7,
                microSummary:
                  'Manual test event generated from the playground for feed validation.',
                markSessionCompleted: Math.random() > 0.8,
              })
            }}
          >
            Add one random event
          </Button>
          <Button asChild variant="ghost" className="w-fit rounded-full">
            <Link to="/">Back to feed</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
