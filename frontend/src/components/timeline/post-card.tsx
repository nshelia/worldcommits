import { formatDistanceToNow } from 'date-fns'
import { motion } from 'motion/react'
import MDXContent from '~/components/mdx-content'
import type { TimelinePostItem } from '~/components/timeline/types'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Link } from '@tanstack/react-router'

export function PostCard({ item, isLast }: { item: TimelinePostItem; isLast?: boolean }) {
  const { post } = item

  return (
    <article className="relative flex gap-4 pb-8">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <Link to="/users/$username" params={{ username: post.githubUsername }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Avatar className="relative z-10 size-10 ring-4 ring-black">
              <AvatarImage
                src={`https://github.com/${post.githubUsername}.png`}
                alt={post.githubUsername}
              />
              <AvatarFallback>
                {post.githubUsername.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </Link>
        {!isLast && (
          <div className="relative -mt-1 h-full w-px">
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-transparent"
              initial={{ scaleY: 0, originY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-4 size-1.5 -translate-x-1/2 rounded-full bg-neutral-700"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
            />
            <motion.div
              className="absolute left-1/2 top-12 size-1 -translate-x-1/2 rounded-full bg-neutral-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
            />
            <motion.div
              className="absolute left-1/2 top-20 size-1 -translate-x-1/2 rounded-full bg-neutral-800/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 500 }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-center gap-2">
          <Link
            to="/users/$username"
            params={{ username: post.githubUsername }}
            className="text-[14px] font-semibold text-white hover:underline"
          >
            {post.githubUsername}
          </Link>
          <span className="text-[12px] text-neutral-600">·</span>
          <span className="text-[12px] text-neutral-600">
            {formatDistanceToNow(post._creationTime, { addSuffix: true })}
          </span>
        </div>

        <h2 className="mt-1.5 text-[15px] leading-snug text-neutral-200">
          {post.title}
        </h2>

        {post.description && (
          <MDXContent
            content={post.description}
            className="mt-2 text-[14px] leading-relaxed text-neutral-400 [&_h1]:text-[14px] [&_h1]:font-medium [&_h1]:text-neutral-300 [&_h2]:text-[13px] [&_h2]:font-medium [&_h2]:text-neutral-300 [&_h3]:text-[13px] [&_h3]:text-neutral-400 [&_p]:text-neutral-400 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:text-neutral-400 [&_code]:rounded [&_code]:bg-neutral-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:text-neutral-300 [&_a]:text-neutral-300 [&_a]:underline [&_a]:underline-offset-2"
          />
        )}

        <div className="mt-3 flex items-center gap-3">
          <span className="text-[12px] text-neutral-600">{post.promptCount} prompts</span>
          <span className="text-[12px] text-green-600">+{post.totalLinesAdded}</span>
          <span className="text-[12px] text-red-600">-{post.totalLinesRemoved}</span>
        </div>
      </div>
    </article>
  )
}
