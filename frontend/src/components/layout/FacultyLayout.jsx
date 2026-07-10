import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useState } from 'react'

export default function FacultyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <Sidebar open={sidebarOpen} role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 bg-mesh">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
