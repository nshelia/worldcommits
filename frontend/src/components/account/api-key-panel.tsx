import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

type ApiKey = {
  _id: string
  keyPrefix: string
  label: string | null
  createdAt: number
  lastUsedAt: number | null
  revokedAt: number | null
}

export function ApiKeyPanel() {
  const { signIn, signOut } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const viewer = useQuery(api.users.viewer)
  const keys = useQuery(
    api.apiKeys.listMyApiKeys,
    isAuthenticated ? {} : 'skip',
  ) as ApiKey[] | undefined
  const createApiKey = useMutation(api.apiKeys.createApiKey)
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey)
  const [label, setLabel] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">MCP API key</CardTitle>
        <p className="text-sm text-muted-foreground">
          The feed is public. Only API key generation requires GitHub login.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {!isLoading && !isAuthenticated && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sign in with GitHub to create a key for MCP `save` requests.
            </p>
            <Button
              type="button"
              onClick={() => void signIn('github', { redirectTo: '/' })}
            >
              Sign in with GitHub
            </Button>
          </div>
        )}

        {!isLoading && isAuthenticated && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                Signed in as{' '}
                <strong>@{viewer?.githubUsername ?? viewer?.name ?? 'user'}</strong>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Key label (optional)"
                className="max-w-64"
              />
              <Button
                type="button"
                onClick={() => {
                  void createApiKey({ label: label.trim() || undefined }).then((result) => {
                    setNewKey(result.apiKey)
                    setLabel('')
                  })
                }}
              >
                Generate key
              </Button>
            </div>

            {newKey && (
              <div className="border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Copy this key now</p>
                <p className="text-muted-foreground">
                  It is only shown once for security.
                </p>
                <code className="block break-all pt-1">{newKey}</code>
              </div>
            )}

            <div className="space-y-2">
              {(keys ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No keys yet.</p>
              )}
              {(keys ?? []).map((key) => (
                <div key={key._id} className="flex items-center justify-between border p-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      {key.label ?? 'Unlabeled key'} ({key.keyPrefix}...)
                    </p>
                    <p className="text-muted-foreground">
                      Created {new Date(key.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!key.revokedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void revokeApiKey({ keyId: key._id as any })}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Revoked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
