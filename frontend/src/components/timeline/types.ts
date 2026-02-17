export type TimelineEvent = {
  _id: string
  timestamp: number
  linesAddedCount: number
  linesRemovedCount: number
  microSummary: string
}

export type TimelinePost = {
  _id: string
  _creationTime: number
  githubUsername: string
  title: string
  description: string
  promptCount: number
  totalWords: number
  totalLinesAdded: number
  totalLinesRemoved: number
  status: 'active' | 'completed'
}

export type TimelinePostItem = {
  post: TimelinePost
  timeline: TimelineEvent[]
}
