import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { Button } from '~/components/ui/button'

type PostDescriptionProps = {
  markdown: string
}

const COLLAPSED_LENGTH = 210

export function PostDescription({ markdown }: PostDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = markdown.length > COLLAPSED_LENGTH

  const content = useMemo(() => {
    if (expanded || !shouldCollapse) return markdown
    return `${markdown.slice(0, COLLAPSED_LENGTH).trimEnd()}...`
  }, [expanded, markdown, shouldCollapse])

  return (
    <div className="space-y-2">
      <div className="space-y-2 text-sm leading-6 text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            h1: (props) => <h3 className="text-base font-semibold" {...props} />,
            h2: (props) => <h4 className="text-sm font-semibold" {...props} />,
            p: (props) => <p className="text-sm text-muted-foreground" {...props} />,
            ul: (props) => <ul className="list-disc space-y-1 pl-5 text-sm" {...props} />,
            ol: (props) => <ol className="list-decimal space-y-1 pl-5 text-sm" {...props} />,
            a: (props) => (
              <a
                className="underline decoration-muted-foreground underline-offset-4"
                target="_blank"
                rel="noreferrer"
                {...props}
              />
            ),
            code: (props) => (
              <code className="rounded-md bg-muted px-1 py-0.5 text-xs" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {shouldCollapse && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'See less' : 'See more'}
        </Button>
      )}
    </div>
  )
}
