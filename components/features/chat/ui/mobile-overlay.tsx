import { memo } from 'react';

interface MobileOverlayProps {
  isVisible: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileOverlay = memo(({ 
  isVisible, 
  onClick, 
  className = "" 
}: MobileOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden
        transition-opacity duration-300 ease-in-out
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="サイドバーを閉じる"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    />
  );
});

MobileOverlay.displayName = 'MobileOverlay'; 