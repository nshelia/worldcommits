import { createFileRoute } from '@tanstack/react-router'
import { UserPage } from '~/pages/user-page'

export const Route = createFileRoute('/users/$username')({
  component: UserTimelineRoute,
})

function UserTimelineRoute() {
  const { username } = Route.useParams()
  return <UserPage username={username} />
}
