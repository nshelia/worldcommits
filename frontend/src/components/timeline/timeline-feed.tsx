import { useEffect, useRef } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../../convex/_generated/api'
import { PostCard } from '~/components/timeline/post-card'
import { syntheticTimelinePosts } from '~/components/timeline/synthetic-posts'
import type { TimelinePostItem } from '~/components/timeline/types'
import { Skeleton } from '~/components/ui/skeleton'

type TimelineFeedProps = {
  username?: string
}

export function TimelineFeed({ username }: TimelineFeedProps) {
  const publicFeed = usePaginatedQuery(
    api.posts.listPublicPosts,
    username ? 'skip' : {},
    { initialNumItems: 6 },
  )
  const userFeed = usePaginatedQuery(
    api.posts.listPublicPostsByUsername,
    username ? { githubUsername: username } : 'skip',
    { initialNumItems: 6 },
  )

  const feed = username ? userFeed : publicFeed
  const results = (feed.results ?? []) as TimelinePostItem[]
  const status = feed.status
  const canLoadMore = status === 'CanLoadMore'
  const isLoadingFirst = status === 'LoadingFirstPage'
  const isLoadingMore = status === 'LoadingMore'

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !canLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting) {
          feed.loadMore(6)
        }
      },
      { rootMargin: '320px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [canLoadMore, feed])

  const itemsToRender =
    !username && results.length === 0 && !isLoadingFirst
      ? syntheticTimelinePosts
      : results

  return (
    <section>
      <div className="w-full">
        <AnimatePresence initial={false} mode="popLayout">
          {itemsToRender.map((item, index) => (
            <motion.div
              key={item.post._id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 40,
                mass: 1,
              }}
              layout
            >
              <PostCard
                item={item}
                isLast={index === itemsToRender.length - 1 && !canLoadMore}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoadingFirst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="flex gap-4 pb-8">
                <div className="flex flex-col items-center">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="mt-2 h-20 w-px bg-neutral-800" />
                </div>
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {username && itemsToRender.length === 0 && !isLoadingFirst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 text-center text-[14px] text-neutral-500"
          >
            No sessions yet for @{username}.
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={sentinelRef} className="h-1" />

      <AnimatePresence>
        {canLoadMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-4"
          >
            <button
              type="button"
              onClick={() => feed.loadMore(6)}
              className="text-[13px] text-neutral-500 hover:text-neutral-300"
            >
              {isLoadingMore ? 'Loading...' : 'Load more commits'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
