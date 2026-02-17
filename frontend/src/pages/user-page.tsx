import { useState } from 'react'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TimelineFeed } from '~/components/timeline/timeline-feed'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Globe, Check, X } from 'lucide-react'

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'GE', name: 'Georgia' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapore' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'EG', name: 'Egypt' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'HU', name: 'Hungary' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'PE', name: 'Peru' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'UY', name: 'Uruguay' },
]

function CountryFlag({ country }: { country: string }) {
  const code = country.toUpperCase()
  const flag = code
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
  return <span className="text-base">{flag}</span>
}

function CountryPicker() {
  const viewer = useQuery(api.users.viewer)
  const updateProfile = useMutation(api.users.updateProfile)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (!viewer) return null

  const currentCountry = viewer.country
  const currentEntry = currentCountry
    ? COUNTRIES.find((c) => c.code === currentCountry)
    : null

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
      >
        {currentEntry ? (
          <>
            <CountryFlag country={currentEntry.code} />
            <span className="text-neutral-300">{currentEntry.name}</span>
          </>
        ) : (
          <>
            <Globe className="size-3.5" />
            <span>Set country</span>
          </>
        )}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setSearch('')
            }}
          />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl shadow-black/30">
            <div className="border-b border-neutral-800 p-2">
              <input
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder-neutral-500 outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {currentCountry && (
                <button
                  type="button"
                  onClick={() => {
                    void updateProfile({ country: '' })
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-neutral-800"
                >
                  <X className="size-3.5" />
                  Clear country
                </button>
              )}
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    void updateProfile({ country: c.code })
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-neutral-800 ${
                    currentCountry === c.code
                      ? 'bg-neutral-800/60 text-white'
                      : 'text-neutral-300'
                  }`}
                >
                  <CountryFlag country={c.code} />
                  <span className="flex-1">{c.name}</span>
                  {currentCountry === c.code && (
                    <Check className="size-3.5 text-green-500" />
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3.5 py-3 text-xs text-neutral-500">
                  No countries found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function UserPage({ username }: { username: string }) {
  const { isAuthenticated } = useConvexAuth()
  const viewer = useQuery(api.users.viewer)
  const isOwnProfile = isAuthenticated && viewer?.githubUsername === username

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 ring-2 ring-neutral-800">
          <AvatarImage
            src={`https://github.com/${username}.png`}
            alt={username}
          />
          <AvatarFallback>
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[18px] font-semibold text-white">{username}</h1>
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-neutral-500">vibecoder</p>
            {viewer?.country && viewer.githubUsername === username && (
              <span className="text-[13px]">
                <CountryFlag country={viewer.country} />
              </span>
            )}
          </div>
          {isOwnProfile && <CountryPicker />}
        </div>
      </div>

      <TimelineFeed username={username} />
    </main>
  )
}
