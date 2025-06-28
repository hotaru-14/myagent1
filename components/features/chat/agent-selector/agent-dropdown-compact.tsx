"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Zap } from 'lucide-react'
import type { Agent } from '@/lib/types/agent'
import { AGENT_COLORS } from '@/lib/constants/agents'

interface AgentDropdownCompactProps {
  selectedAgent: Agent
  availableAgents: Agent[]
  onAgentChange: (agentId: string) => void
  isChanging?: boolean
  disabled?: boolean
  className?: string
}

export function AgentDropdownCompact({
  selectedAgent,
  availableAgents,
  onAgentChange,
  isChanging = false,
  disabled = false,
  className = ""
}: AgentDropdownCompactProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colorClass = AGENT_COLORS[selectedAgent.color as keyof typeof AGENT_COLORS] || AGENT_COLORS.gray

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleAgentSelect = (agentId: string) => {
    if (disabled || isChanging) return
    onAgentChange(agentId)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Compact Toggle Button */}
      <button
        type="button"
        className={`
          flex items-center space-x-1 px-2 py-1.5 
          text-xs font-medium rounded-md border transition-all duration-200
          ${isOpen 
            ? 'border-blue-300 ring-1 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-300
        `}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`エージェント: ${selectedAgent.name}`}
      >
        {/* Agent Icon */}
        <div className={`
          w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0
          ${isChanging 
            ? 'animate-pulse bg-gray-300 dark:bg-gray-600' 
            : colorClass
          }
        `}>
          {isChanging ? <Zap className="w-2 h-2" /> : selectedAgent.icon}
        </div>
        
        {/* Agent Name (shortened) */}
        <span className={`
          max-w-16 truncate text-gray-900 dark:text-gray-100
          ${isChanging ? 'animate-pulse' : ''}
        `}>
          {isChanging ? '切替中' : selectedAgent.name.replace('エージェント', '').replace('アシスタント', '')}
        </span>

        {/* Dropdown Arrow */}
        <ChevronDown className={`
          w-3 h-3 text-gray-400 transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      {/* Compact Dropdown Menu */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-1 z-50
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
          rounded-md shadow-lg ring-1 ring-black/5 dark:ring-white/10
          max-h-48 overflow-y-auto w-64
          animate-in slide-in-from-top-2 duration-200
        `}>
          <div className="py-1" role="listbox">
            {availableAgents.map((agent) => {
              const agentColorClass = AGENT_COLORS[agent.color as keyof typeof AGENT_COLORS] || AGENT_COLORS.gray
              const isSelected = agent.id === selectedAgent.id

              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`
                    w-full flex items-center space-x-2 px-3 py-2 text-xs
                    transition-colors duration-150
                    ${isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => handleAgentSelect(agent.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Agent Icon */}
                  <div className={`
                    w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0
                    ${isSelected ? agentColorClass : 'bg-gray-100 dark:bg-gray-600 text-gray-500'}
                  `}>
                    {agent.icon}
                  </div>
                  
                  {/* Agent Name */}
                  <span className="font-medium whitespace-nowrap">
                    {agent.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 