import { ReaderClient } from './reader-client'

export const dynamic = 'force-dynamic'

export default async function ReaderPage() {
  // Server Component - no interactivity needed here
  return (
    <div className="min-h-screen bg-parchment">
      <ReaderClient />
    </div>
  )
}
