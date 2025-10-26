import { ReaderClient } from './reader-client'

export default async function ReaderPage() {
  // Server Component - no interactivity needed here
  return (
    <div className="min-h-screen bg-parchment">
      <ReaderClient />
    </div>
  )
}
