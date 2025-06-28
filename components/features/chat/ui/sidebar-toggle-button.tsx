import { memo } from 'react';

interface SidebarToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

const AnimatedArrowIcon = memo(({ isOpen }: { isOpen: boolean }) => (
  <div className="relative w-5 h-5">
    {/* 右矢印アイコン（サイドバーを開く） */}
    <svg 
      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out ${
        !isOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
      }`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
    
    {/* 左矢印アイコン（サイドバーを閉じる） */}
    <svg 
      className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
      }`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </div>
));
AnimatedArrowIcon.displayName = 'AnimatedArrowIcon';

export const SidebarToggleButton = memo(({ 
  isOpen, 
  onToggle, 
  disabled = false,
  className = "" 
}: SidebarToggleButtonProps) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all duration-300 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isOpen 
          ? 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600' 
          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
        }
        ${className}
      `}
      title={`サイドバーを${isOpen ? '閉じる' : '開く'} (Ctrl + \\)`}
      aria-label={`サイドバーを${isOpen ? '閉じる' : '開く'}`}
      aria-expanded={isOpen}
    >
      <AnimatedArrowIcon isOpen={isOpen} />
    </button>
  );
});

SidebarToggleButton.displayName = 'SidebarToggleButton'; 