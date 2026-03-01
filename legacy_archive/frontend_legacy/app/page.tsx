'use client'

import { Sidebar } from '@/components/Sidebar'
import { SubjectSelector } from '@/components/SubjectSelector'

export default function HomePage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-hidden">
        <SubjectSelector />
      </main>
    </div>
  )
}
