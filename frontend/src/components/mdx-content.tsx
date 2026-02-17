"use client"

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeSanitize from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"
import { useEffect, useState } from "react"

interface MDXContentProps {
  content: string
  className?: string
}

const MDXContent = ({ content, className }: MDXContentProps) => {
  const [processedContent, setProcessedContent] = useState("")

  useEffect(() => {
    const processContent = async () => {
      const result = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(content)

      setProcessedContent(String(result))
    }

    processContent()
  }, [content])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

export default MDXContent
