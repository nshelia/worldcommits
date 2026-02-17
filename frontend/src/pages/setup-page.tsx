import { useState } from 'react'
import { Copy, Check, Terminal, Zap, Users, Globe } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ApiKeyPanel } from '~/components/account/api-key-panel'

const MCP_URL = 'https://mcp.worldcommits.com'

type Client = 'cursor' | 'claude-code' | 'vscode' | 'windsurf'

const CLIENTS: { id: Client; name: string; description: string }[] = [
  { id: 'cursor', name: 'Cursor', description: 'AI-native code editor' },
  { id: 'claude-code', name: 'Claude Code', description: 'Anthropic CLI agent' },
  { id: 'vscode', name: 'VS Code + Copilot', description: 'With GitHub Copilot' },
  { id: 'windsurf', name: 'Windsurf', description: 'Codeium AI editor' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-xs text-neutral-500">{language ?? 'json'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-xs font-semibold text-neutral-300">
      {n}
    </span>
  )
}

function CursorSetup() {
  const jsonConfig = `{
  "mcpServers": {
    "worldcommits": {
      "url": "${MCP_URL}"
    }
  }
}`

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-neutral-400">
        Add the WorldCommits MCP server to your project or global config.
      </p>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Open your <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">.cursor/mcp.json</code> file (project-level or global)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[14px] text-neutral-300">Add this config</p>
            <CodeBlock code={jsonConfig} />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Generate an API key below and add it to the MCP tool when prompted
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClaudeCodeSetup() {
  const installCmd = `claude mcp add --transport http worldcommits ${MCP_URL}`

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-neutral-400">
        Add WorldCommits to Claude Code with a single command.
      </p>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[14px] text-neutral-300">Navigate to your project and run</p>
            <CodeBlock code={installCmd} language="bash" />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Start Claude Code and verify with <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">/mcp</code>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Generate an API key below and pass it when the tool asks for <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">api_key</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function VSCodeSetup() {
  const jsonConfig = `{
  "mcpServers": {
    "worldcommits": {
      "url": "${MCP_URL}"
    }
  }
}`

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-neutral-400">
        Add WorldCommits MCP to VS Code with GitHub Copilot.
      </p>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Open Command Palette and run <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">MCP: Add Server</code>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[14px] text-neutral-300">
              Select HTTP and enter the URL, or manually add to your <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">.vscode/mcp.json</code>
            </p>
            <CodeBlock code={jsonConfig} />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={3} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Generate an API key below and provide it when requested
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function WindsurfSetup() {
  const jsonConfig = `{
  "mcpServers": {
    "worldcommits": {
      "serverUrl": "${MCP_URL}"
    }
  }
}`

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-neutral-400">
        Add WorldCommits MCP to Windsurf.
      </p>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StepNumber n={1} />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[14px] text-neutral-300">
              Add to your <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[12px] text-neutral-200">mcp_config.json</code>
            </p>
            <CodeBlock code={jsonConfig} />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <StepNumber n={2} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-neutral-300">
              Restart Windsurf and generate an API key below
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const CLIENT_SETUP: Record<Client, () => JSX.Element> = {
  cursor: CursorSetup,
  'claude-code': ClaudeCodeSetup,
  vscode: VSCodeSetup,
  windsurf: WindsurfSetup,
}

export function SetupPage() {
  const [activeClient, setActiveClient] = useState<Client>('cursor')
  const ActiveSetup = CLIENT_SETUP[activeClient]

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-semibold">Setup</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Connect your AI editor to WorldCommits and start publishing your coding sessions to the public timeline.
        </p>
      </div>

      {/* What is WorldCommits */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <h2 className="text-[15px] font-semibold text-white">What is WorldCommits MCP?</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
          WorldCommits is an MCP server that lets your AI coding assistant automatically publish session activity to a public feed. Every prompt, edit, and commit gets tracked and shown on the{' '}
          <Link to="/" className="text-neutral-300 underline underline-offset-2">timeline</Link>{' '}
          so other vibecoders can see what you're building in real time.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-neutral-800/60 px-3 py-2.5">
            <Zap className="size-4 shrink-0 text-amber-400" />
            <span className="text-[13px] text-neutral-300">Live feed</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-neutral-800/60 px-3 py-2.5">
            <Users className="size-4 shrink-0 text-blue-400" />
            <span className="text-[13px] text-neutral-300">Vibecoders</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-neutral-800/60 px-3 py-2.5">
            <Globe className="size-4 shrink-0 text-green-400" />
            <span className="text-[13px] text-neutral-300">Public profiles</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <h2 className="text-[15px] font-semibold text-white">How it works</h2>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-start gap-3">
            <StepNumber n={1} />
            <p className="text-[14px] text-neutral-400">
              <span className="text-neutral-200">Sign in with GitHub</span> to create your WorldCommits account
            </p>
          </div>
          <div className="flex items-start gap-3">
            <StepNumber n={2} />
            <p className="text-[14px] text-neutral-400">
              <span className="text-neutral-200">Generate an API key</span> from the panel below
            </p>
          </div>
          <div className="flex items-start gap-3">
            <StepNumber n={3} />
            <p className="text-[14px] text-neutral-400">
              <span className="text-neutral-200">Add the MCP server</span> to your AI editor using the instructions below
            </p>
          </div>
          <div className="flex items-start gap-3">
            <StepNumber n={4} />
            <p className="text-[14px] text-neutral-400">
              <span className="text-neutral-200">Start coding</span> and your sessions will appear on the timeline automatically
            </p>
          </div>
        </div>
      </div>

      {/* MCP Endpoint */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <h2 className="text-[15px] font-semibold text-white">MCP endpoint</h2>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          This is the URL to add as your MCP server
        </p>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
          <code className="text-[14px] text-neutral-200">{MCP_URL}</code>
          <CopyButton text={MCP_URL} />
        </div>
      </div>

      {/* Client Setup */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <h2 className="text-[15px] font-semibold text-white">Connect your editor</h2>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          Select your AI client and follow the steps
        </p>

        {/* Client Tabs */}
        <div className="mt-4 flex gap-2">
          {CLIENTS.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => setActiveClient(client.id)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeClient === client.id
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {client.name}
            </button>
          ))}
        </div>

        {/* Active client setup */}
        <div className="mt-5">
          <ActiveSetup />
        </div>
      </div>

      {/* Quick Install */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-4 text-neutral-400" />
          <h2 className="text-[15px] font-semibold text-white">Quick install (all clients)</h2>
        </div>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          Auto-detect and configure all installed AI clients at once
        </p>
        <div className="mt-3">
          <CodeBlock code={`npx add-mcp ${MCP_URL}`} language="bash" />
        </div>
      </div>

      {/* API Key */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-white">API key</h2>
        <ApiKeyPanel />
      </div>

      {/* Available tools */}
      <div className="rounded-2xl bg-neutral-900/60 p-5">
        <h2 className="text-[15px] font-semibold text-white">Available tool</h2>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          WorldCommits MCP exposes one tool to your AI assistant
        </p>

        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-2">
            <code className="text-[14px] font-semibold text-white">save</code>
            <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
              authenticated
            </span>
          </div>
          <p className="mt-1.5 text-[13px] text-neutral-400">
            Persists a completion event to the WorldCommits feed. Called automatically by your AI assistant after each interaction.
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-[12px] font-medium text-neutral-500">Parameters</p>
            <div className="space-y-1 text-[13px]">
              <div className="flex gap-2">
                <code className="text-neutral-300">api_key</code>
                <span className="text-neutral-600">string, required</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">prompt_summary</code>
                <span className="text-neutral-600">string, required</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">completion_type</code>
                <span className="text-neutral-600">enum, required</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">completion_word_count</code>
                <span className="text-neutral-600">number, required</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">files_edited</code>
                <span className="text-neutral-600">string[], optional</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">project</code>
                <span className="text-neutral-600">string, optional</span>
              </div>
              <div className="flex gap-2">
                <code className="text-neutral-300">client</code>
                <span className="text-neutral-600">string, optional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
