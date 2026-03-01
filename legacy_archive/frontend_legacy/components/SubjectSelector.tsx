'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Calculator, FlaskConical, BookMarked, Code, TrendingUp } from 'lucide-react'

const subjects = [
  { id: 'math', name: 'Math', icon: Calculator, color: 'bg-blue-500' },
  { id: 'sciences', name: 'Sciences', icon: FlaskConical, color: 'bg-green-500' },
  { id: 'humanities', name: 'Humanities', icon: BookMarked, color: 'bg-purple-500' },
  { id: 'economics', name: 'Economics', icon: TrendingUp, color: 'bg-orange-500' },
  { id: 'cs', name: 'Computer Science', icon: Code, color: 'bg-indigo-500' },
  { id: 'general', name: 'General Study', icon: BookOpen, color: 'bg-pink-500' },
]

export function SubjectSelector() {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId)
    setTimeout(() => {
      router.push(`/chat?subject=${subjectId}`)
    }, 300)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Welcome to <span className="text-ap-yellow">PlugGPT</span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
          Select a subject to begin your academic journey
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const Icon = subject.icon
            const isSelected = selectedSubject === subject.id

            return (
              <button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject.id)}
                className={`
                  group relative p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  ${isSelected 
                    ? 'bg-ap-yellow scale-105' 
                    : 'bg-white dark:bg-gray-800 hover:scale-102'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    p-4 rounded-xl ${subject.color} text-white
                    ${isSelected ? 'scale-110' : 'group-hover:scale-110'}
                    transition-transform duration-300
                  `}>
                    <Icon size={32} />
                  </div>
                  <h3 className={`
                    text-xl font-semibold
                    ${isSelected 
                      ? 'text-gray-900' 
                      : 'text-gray-900 dark:text-white'
                    }
                  `}>
                    {subject.name}
                  </h3>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
