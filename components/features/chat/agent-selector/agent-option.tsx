"use client"

import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import type { Agent } from '@/lib/types/agent'
import { AGENT_COLORS } from '@/lib/constants/agents'

interface AgentOptionProps {
  agent: Agent
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export const AgentOption = forwardRef<HTMLDivElement, AgentOptionProps>(
  ({ agent, isSelected = false, onClick, className = "" }, ref) => {
    const colorClass = AGENT_COLORS[agent.color as keyof typeof AGENT_COLORS] || AGENT_COLORS.gray

    return (
      <div
        ref={ref}
        className={`
          flex items-center justify-between px-4 py-3 cursor-pointer
          transition-all duration-200 ease-in-out
          hover:bg-gray-50 dark:hover:bg-gray-700
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}
          ${className}
        `}
        onClick={onClick}
        role="option"
        aria-selected={isSelected}
      >
        {/* Agent Info */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Agent Icon */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isSelected ? colorClass : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}
          `}>
            {agent.icon}
          </div>
          
          {/* Agent Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className={`font-medium text-sm truncate ${
                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {agent.name}
              </span>
            </div>
            <p className={`text-xs truncate ${
              isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {agent.description}
            </p>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="ml-2 flex-shrink-0">
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    )
  }
)

AgentOption.displayName = 'AgentOption' 