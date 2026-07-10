import { Menu, Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function Topbar({ onToggleSidebar }) {
  const { user } = useAuthStore()
  const [showNotif, setShowNotif] = useState(false)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.list().then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = data?.filter(n => !n.is_read).length || 0
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center px-4 gap-4 shrink-0">
      <button onClick={onToggleSidebar} className="btn-ghost p-2 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <p className="text-sm text-slate-400 hidden sm:block">
          {greeting}, <span className="text-white font-medium">{user?.full_name?.split(' ')[0]}</span>!
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input pl-9 w-48 py-1.5 text-xs"
          placeholder="Search..."
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="btn-ghost p-2 rounded-lg relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-80 card z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge-primary">{unreadCount} new</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {(!data || data.length === 0) ? (
                <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
              ) : (
                data.slice(0, 10).map(n => (
                  <div key={n.id} className={`p-3 border-b border-slate-700/30 ${!n.is_read ? 'bg-primary-500/5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
        {user?.full_name?.charAt(0) || 'U'}
      </div>
    </header>
  )
}
