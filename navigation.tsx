'use client'

import { ActiveSection } from '@/lib/types'

interface NavigationProps {
  activeSection: ActiveSection
  onSectionChange: (section: ActiveSection) => void
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="grid-border-b">
      <div className="grid grid-cols-2">
        <button
          onClick={() => onSectionChange('home')}
          className={`py-4 px-6 text-sm uppercase tracking-widest transition-colors grid-border-r ${
            activeSection === 'home'
              ? 'bg-foreground text-background'
              : 'bg-background text-foreground hover:bg-foreground hover:text-background'
          }`}
        >
          [REC]
        </button>
        <button
          onClick={() => onSectionChange('history')}
          className={`py-4 px-6 text-sm uppercase tracking-widest transition-colors ${
            activeSection === 'history'
              ? 'bg-foreground text-background'
              : 'bg-background text-foreground hover:bg-foreground hover:text-background'
          }`}
        >
          [HISTORY]
        </button>
      </div>
    </nav>
  )
}
