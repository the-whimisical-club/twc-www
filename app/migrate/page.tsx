import { requireAdmin } from '@/app/utils/auth'
import { getPendingUsers } from '@/app/actions/migrate'
import MigrateClient from './migrate-client'

export default async function MigratePage() {
  await requireAdmin()

  let result
  let pendingUsers: Array<{ email: string; auth_user_id: string | null }> = []
  
  try {
    result = await getPendingUsers()
    pendingUsers = result.users || []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load pending users'
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl text-foreground font-dark-london mb-8">
            approve users
          </h1>
          <div className="bg-red-500/20 text-red-500 p-4 rounded mb-4">
            <div className="font-stack-sans-notch font-bold mb-2">Error:</div>
            <div className="font-stack-sans-notch whitespace-pre-wrap">{errorMessage}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl text-foreground font-dark-london mb-8">
          approve users
        </h1>
        
        {result.error && (
          <div className="bg-red-500/20 text-red-500 p-4 rounded mb-4">
            {result.error}
          </div>
        )}

        {pendingUsers.length === 0 ? (
          <div className="text-foreground font-stack-sans-notch text-xl">
            no pending users to approve
          </div>
        ) : (
          <MigrateClient initialUsers={pendingUsers} />
        )}
      </div>
    </div>
  )
}

