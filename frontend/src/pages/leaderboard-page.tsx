import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Link } from '@tanstack/react-router'
import {
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  SlidersHorizontal,
  Crown,
  Medal,
  Award,
  ChevronDown,
  X,
} from 'lucide-react'
import { LiveStatsBanner } from '~/components/live-stats-banner'
import { Skeleton } from '~/components/ui/skeleton'

type TimeRange = 'today' | 'week' | 'month' | 'all'
type SortBy = 'prompts' | 'words' | 'lines' | 'sessions'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const SORT_OPTIONS: { value: SortBy; label: string; description: string }[] = [
  { value: 'prompts', label: 'Prompts', description: 'Total prompts sent' },
  { value: 'words', label: 'Words', description: 'Total words generated' },
  { value: 'lines', label: 'Lines Changed', description: 'Lines added + removed' },
  { value: 'sessions', label: 'Sessions', description: 'Coding sessions completed' },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15">
        <Crown className="size-4 text-amber-400" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-400/10">
        <Medal className="size-4 text-neutral-300" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex size-8 items-center justify-center rounded-xl bg-amber-700/10">
        <Award className="size-4 text-amber-700" />
      </div>
    )
  }
  return (
    <div className="flex size-8 items-center justify-center">
      <span className="text-sm font-semibold tabular-nums text-neutral-600">{rank}</span>
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function getSortValue(
  user: {
    totalPrompts: number
    totalWords: number
    totalLinesAdded: number
    totalLinesRemoved: number
    sessionCount: number
  },
  sortBy: SortBy,
): number {
  switch (sortBy) {
    case 'prompts':
      return user.totalPrompts
    case 'words':
      return user.totalWords
    case 'lines':
      return user.totalLinesAdded + user.totalLinesRemoved
    case 'sessions':
      return user.sessionCount
  }
}

function getSortLabel(sortBy: SortBy): string {
  switch (sortBy) {
    case 'prompts':
      return 'prompts'
    case 'words':
      return 'words'
    case 'lines':
      return 'lines'
    case 'sessions':
      return 'sessions'
  }
}

function CountryFlag({ country }: { country: string }) {
  const code = country.toUpperCase()
  const flag = code
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
  return <span className="text-sm" title={country}>{flag}</span>
}

export function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [sortBy, setSortBy] = useState<SortBy>('prompts')
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const leaderboard = useQuery(api.posts.leaderboard, {
    timeRange,
    sortBy,
    country,
  })

  const countries = useQuery(api.posts.leaderboardCountries)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-neutral-500">Top vibecoders ranked by activity</p>
      </div>

      <LiveStatsBanner />

      {/* Time Range Pills */}
      <div className="flex items-center gap-2">
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTimeRange(option.value)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
              timeRange === option.value
                ? 'bg-white text-black'
                : 'bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2">
        {/* Sort By Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSortDropdown(!showSortDropdown)
              setShowCountryDropdown(false)
            }}
            className="flex items-center gap-2 rounded-xl bg-neutral-900/60 px-3.5 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <SlidersHorizontal className="size-3.5" />
            Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            <ChevronDown className="size-3.5" />
          </button>
          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl shadow-black/30">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`flex w-full flex-col px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-800 ${
                      sortBy === option.value ? 'bg-neutral-800/60' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${sortBy === option.value ? 'text-white' : 'text-neutral-300'}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-neutral-500">{option.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Country Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCountryDropdown(!showCountryDropdown)
              setShowSortDropdown(false)
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm transition-colors ${
              country
                ? 'bg-white/10 text-white'
                : 'bg-neutral-900/60 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Globe className="size-3.5" />
            {country ? (
              <>
                <CountryFlag country={country} />
                {country.toUpperCase()}
              </>
            ) : (
              'All Countries'
            )}
            <ChevronDown className="size-3.5" />
          </button>
          {showCountryDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCountryDropdown(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1.5 max-h-64 w-48 overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl shadow-black/30">
                <button
                  type="button"
                  onClick={() => {
                    setCountry(undefined)
                    setShowCountryDropdown(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-neutral-800 ${
                    !country ? 'bg-neutral-800/60 text-white' : 'text-neutral-300'
                  }`}
                >
                  <Globe className="size-3.5 text-neutral-500" />
                  All Countries
                </button>
                {countries?.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCountry(c)
                      setShowCountryDropdown(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-neutral-800 ${
                      country === c ? 'bg-neutral-800/60 text-white' : 'text-neutral-300'
                    }`}
                  >
                    <CountryFlag country={c} />
                    {c.toUpperCase()}
                  </button>
                ))}
                {countries?.length === 0 && (
                  <div className="px-3.5 py-3 text-xs text-neutral-500">
                    No countries set yet
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Active Filter Clear */}
        {country && (
          <button
            type="button"
            onClick={() => setCountry(undefined)}
            className="flex items-center gap-1 rounded-xl bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            <X className="size-3" />
            Clear filter
          </button>
        )}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-1.5">
        {/* Loading Skeletons */}
        {!leaderboard &&
          Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex items-center gap-3 rounded-2xl bg-neutral-900/60 p-4"
            >
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-3 w-44 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
          ))}

        {/* Top 3 Podium Cards */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pb-2">
            {[1, 0, 2].map((podiumIdx) => {
              const user = leaderboard[podiumIdx]
              if (!user) return <div key={podiumIdx} />
              const rank = podiumIdx + 1
              const bgColor =
                rank === 1
                  ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 ring-1 ring-amber-500/20'
                  : rank === 2
                    ? 'bg-gradient-to-b from-neutral-400/10 to-neutral-400/5 ring-1 ring-neutral-500/20'
                    : 'bg-gradient-to-b from-amber-800/10 to-amber-800/5 ring-1 ring-amber-700/20'
              const isCenter = rank === 1

              return (
                <Link
                  key={user.githubUsername}
                  to="/users/$username"
                  params={{ username: user.githubUsername }}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:scale-[1.02] ${bgColor} ${isCenter ? 'row-start-1 -mt-2' : ''}`}
                >
                  <RankBadge rank={rank} />
                  <Avatar className={isCenter ? 'size-14 ring-2 ring-amber-500/30' : 'size-11'}>
                    <AvatarImage
                      src={`https://github.com/${user.githubUsername}.png`}
                      alt={user.githubUsername}
                    />
                    <AvatarFallback>
                      {user.githubUsername.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold text-white">
                      @{user.githubUsername}
                    </span>
                    {user.country && (
                      <CountryFlag country={user.country} />
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold tabular-nums text-white">
                      {formatNumber(getSortValue(user, sortBy))}
                    </span>
                    <span className="text-xs text-neutral-500">{getSortLabel(sortBy)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Remaining Users */}
        {leaderboard?.slice(3).map((user, index) => {
          const rank = index + 4
          const mainValue = getSortValue(user, sortBy)

          return (
            <Link
              key={user.githubUsername}
              to="/users/$username"
              params={{ username: user.githubUsername }}
              className="group flex items-center gap-3 rounded-2xl bg-neutral-900/60 p-3.5 transition-colors hover:bg-neutral-800/80"
            >
              <RankBadge rank={rank} />

              <Avatar size="sm">
                <AvatarImage
                  src={`https://github.com/${user.githubUsername}.png`}
                  alt={user.githubUsername}
                />
                <AvatarFallback>
                  {user.githubUsername.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    @{user.githubUsername}
                  </span>
                  {user.country && <CountryFlag country={user.country} />}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{user.totalPrompts} prompts</span>
                  <span>{user.sessionCount} sessions</span>
                  <span className="flex items-center gap-0.5 text-green-500/80">
                    <ArrowUpRight className="size-3" />
                    {formatNumber(user.totalLinesAdded)}
                  </span>
                  <span className="flex items-center gap-0.5 text-red-500/80">
                    <ArrowDownRight className="size-3" />
                    {formatNumber(user.totalLinesRemoved)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-semibold text-white tabular-nums">
                  {formatNumber(mainValue)}
                </span>
                <p className="text-xs text-neutral-500">{getSortLabel(sortBy)}</p>
              </div>
            </Link>
          )
        })}

        {/* Empty State */}
        {leaderboard?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-900/60 p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-800">
              <Flame className="size-6 text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-400">No vibecoders found</p>
              <p className="mt-1 text-xs text-neutral-600">
                {country
                  ? 'No users from this country yet. Try a different filter.'
                  : timeRange !== 'all'
                    ? 'No activity in this time period. Try a wider range.'
                    : 'Be the first one to start vibing!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
