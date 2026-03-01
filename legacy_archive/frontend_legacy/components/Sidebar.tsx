'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  Home, 
  BookOpen, 
  PenTool, 
  Calculator, 
  FlaskConical, 
  BookMarked, 
  GraduationCap,
  FolderOpen,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

const menuItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'study', label: 'Study Tools', icon: BookOpen, path: '/study-tools' },
  { id: 'writing', label: 'Writing Tools', icon: PenTool, path: '/writing-tools' },
  { id: 'math', label: 'Math', icon: Calculator, path: '/chat?subject=math' },
  { id: 'sciences', label: 'Sciences', icon: FlaskConical, path: '/chat?subject=sciences' },
  { id: 'humanities', label: 'Humanities', icon: BookMarked, path: '/chat?subject=humanities' },
  { id: 'ib', label: 'IB Tools', icon: GraduationCap, path: '/ib-tools' },
  { id: 'workspace', label: 'Workspace', icon: FolderOpen, path: '/workspace' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleNavigate = (path: string) => {
    router.push(path)
    setIsMobileOpen(false)
  }

  const logoSrc = theme === 'dark' 
    ? '/logos/WhiteBGMain.png' 
    : '/logos/BlackBGMain.png'

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-ap-yellow text-gray-900 shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 z-40
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="relative h-12 w-48">
              <Image
                src={logoSrc}
                alt="The Academic Plug"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || 
                (item.path.startsWith('/chat') && pathname?.startsWith('/chat'))
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-ap-yellow text-gray-900 shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={20} />
                  <span className="font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={20} />
                  <span className="font-medium">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
