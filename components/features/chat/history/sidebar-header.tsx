import { memo } from 'react';
import { SidebarToggleButton } from '../ui/sidebar-toggle-button';

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export const SidebarHeader = memo(({ 
  isOpen, 
  onToggle, 
  title = "会話履歴",
  disabled = false,
  className = "" 
}: SidebarHeaderProps) => {
  return (
    <div className={`
      p-4 bg-gray-200 flex items-center
      ${isOpen ? 'justify-between' : 'justify-center'}
      ${className}
    `}>
      {isOpen && (
        <h2 className="font-semibold text-gray-800 select-none">
          {title}
        </h2>
      )}
      
      <SidebarToggleButton 
        isOpen={isOpen} 
        onToggle={onToggle}
        disabled={disabled}
      />
    </div>
  );
});

SidebarHeader.displayName = 'SidebarHeader'; 