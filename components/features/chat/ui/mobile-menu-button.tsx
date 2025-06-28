import { memo } from 'react';

interface MobileMenuButtonProps {
  onClick: () => void;
  isVisible?: boolean;
  disabled?: boolean;
  className?: string;
}

const HamburgerIcon = memo(() => (
  <svg 
    className="w-5 h-5" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 6h16M4 12h16M4 18h16" 
    />
  </svg>
));
HamburgerIcon.displayName = 'HamburgerIcon';

export const MobileMenuButton = memo(({ 
  onClick, 
  isVisible = true,
  disabled = false,
  className = "" 
}: MobileMenuButtonProps) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        md:hidden absolute top-4 left-4 z-10 p-2 rounded-lg 
        transition-all duration-300 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        bg-white/20 hover:bg-white/30 text-white shadow-lg hover:shadow-xl
        ${className}
      `}
      title="メニューを開く"
      aria-label="メニューを開く"
      type="button"
    >
      <HamburgerIcon />
    </button>
  );
});

MobileMenuButton.displayName = 'MobileMenuButton'; 