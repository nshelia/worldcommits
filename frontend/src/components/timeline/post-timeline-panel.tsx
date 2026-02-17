import type { TimelineEvent } from '~/components/timeline/types'

type PostTimelinePanelProps = {
  timeline: TimelineEvent[]
}

export function PostTimelinePanel({ timeline }: PostTimelinePanelProps) {
  if (timeline.length === 0) return null

  return (
    <div className="relative pl-4">
      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />

      <div className="space-y-4">
        {timeline.map((event, index) => {
          const isPositive = event.linesAddedCount >= event.linesRemovedCount
          const isFirst = index === 0

          return (
            <div key={event._id} className="relative">
              <div
                className={`absolute -left-4 top-1.5 size-2.5 border-2 bg-background ${
                  isFirst
                    ? 'border-foreground'
                    : 'border-muted-foreground'
                }`}
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-xs ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    +{event.linesAddedCount} -{event.linesRemovedCount}
                  </span>
                </div>
                <p className={`text-sm leading-snug ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {event.microSummary}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
