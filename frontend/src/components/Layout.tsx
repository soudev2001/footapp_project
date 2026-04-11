import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useState } from 'react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Navbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
