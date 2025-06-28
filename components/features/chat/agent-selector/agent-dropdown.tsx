"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Bot, Zap } from 'lucide-react'
import { AgentOption } from './agent-option'
import type { Agent } from '@/lib/types/agent'
import { AGENT_COLORS } from '@/lib/constants/agents'

interface AgentDropdownProps {
  selectedAgent: Agent
  availableAgents: Agent[]
  onAgentChange: (agentId: string) => void
  isChanging?: boolean
  disabled?: boolean
  className?: string
}

export function AgentDropdown({
  selectedAgent,
  availableAgents,
  onAgentChange,
  isChanging = false,
  disabled = false,
  className = ""
}: AgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const colorClass = AGENT_COLORS[selectedAgent.color as keyof typeof AGENT_COLORS] || AGENT_COLORS.gray

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev < availableAgents.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : availableAgents.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (focusedIndex >= 0) {
            handleAgentSelect(availableAgents[focusedIndex].id)
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          toggleRef.current?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, availableAgents])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    setFocusedIndex(-1)
  }

  const handleAgentSelect = (agentId: string) => {
    if (disabled || isChanging) return
    onAgentChange(agentId)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Toggle Button */}
      <button
        ref={toggleRef}
        type="button"
        className={`
          w-full flex items-center justify-between px-3 py-2 
          text-sm font-medium rounded-lg border transition-all duration-200
          ${isOpen 
            ? 'border-blue-300 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300
        `}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`エージェント選択: ${selectedAgent.name}`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Selected Agent Icon */}
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
            ${isChanging 
              ? 'animate-pulse bg-gray-300 dark:bg-gray-600' 
              : colorClass
            }
          `}>
            {isChanging ? <Zap className="w-3 h-3" /> : selectedAgent.icon}
          </div>
          
          {/* Selected Agent Name */}
          <span className={`
            truncate text-gray-900 dark:text-gray-100
            ${isChanging ? 'animate-pulse' : ''}
          `}>
            {isChanging ? 'エージェント切り替え中...' : selectedAgent.name}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`
          w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-1 z-50
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
          rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10
          max-h-64 overflow-y-auto w-80
          animate-in slide-in-from-top-2 duration-200
        `}>
          <div 
            className="py-1" 
            role="listbox"
            aria-label="エージェント選択"
          >
            {availableAgents.map((agent, index) => (
              <div
                key={agent.id}
                className={focusedIndex === index ? 'bg-gray-50 dark:bg-gray-700' : ''}
              >
                <AgentOption
                  agent={agent}
                  isSelected={agent.id === selectedAgent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                />
              </div>
            ))}
          </div>

          {/* Footer with hint */}
          <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Bot className="w-3 h-3" />
              <span className="whitespace-nowrap">エージェントは会話内で自由に切り替えできます</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 