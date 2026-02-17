import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Orb } from '~/components/orb'

export function LiveStatsBanner() {
  const stats = useQuery(api.posts.liveStats)

  const active = stats?.activeVibecoders ?? 0
  const prompts = stats?.recentPrompts ?? 0
  const registered = stats?.totalRegistered ?? 0

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-3 rounded-xl bg-neutral-900/60 px-4 py-3.5">
        <Orb color="red" size={32} value={active} />
        <div>
          <span className="block text-2xl font-bold tracking-tight text-white tabular-nums">
            {stats ? active : '-'}
          </span>
          <span className="block text-xs text-neutral-500">active now</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-neutral-900/60 px-4 py-3.5">
        <Orb color="amber" size={32} value={prompts} />
        <div>
          <span className="block text-2xl font-bold tracking-tight text-white tabular-nums">
            {stats ? prompts : '-'}
          </span>
          <span className="block text-xs text-neutral-500">prompts (10m)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-neutral-900/60 px-4 py-3.5">
        <Orb color="blue" size={32} value={registered} />
        <div>
          <span className="block text-2xl font-bold tracking-tight text-white tabular-nums">
            {stats ? registered : '-'}
          </span>
          <span className="block text-xs text-neutral-500">vibecoders</span>
        </div>
      </div>
    </div>
  )
}
