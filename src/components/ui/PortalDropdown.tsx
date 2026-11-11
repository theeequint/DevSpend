// ============================================================
// DevSpend — Portal Dropdown / Floating Popover Container
// Renders menus into document.body via React Portal with fixed
// viewport coordinates so overflow-x-auto and header stacking
// contexts never clip or obscure popovers.
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  align?: 'left' | 'right';
  offsetY?: number;
  /** Render as full-width bottom sheet below 640px (sm) viewport */
  mobileBottomSheet?: boolean;
  className?: string;
  style?: React.CSSProperties;
  backdropClassName?: string;
  children: React.ReactNode;
}

interface Coordinates {
  top: number;
  left?: number;
  right?: number;
  maxHeight: number;
  ready: boolean;
}

export const PortalDropdown: React.FC<PortalDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  align = 'right',
  offsetY = 8,
  mobileBottomSheet = false,
  className = '',
  style,
  backdropClassName = 'bg-transparent',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [coords, setCoords] = useState<Coordinates>({
    top: 0,
    right: 8,
    maxHeight: 400,
    ready: false,
  });

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const mobile = window.innerWidth < 640;
    setIsMobileViewport(mobile);

    if (mobileBottomSheet && mobile) {
      setCoords({
        top: 0,
        left: 0,
        right: 0,
        maxHeight: Math.round(window.innerHeight * 0.88),
        ready: true,
      });
      return;
    }

    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const edgeMargin = 8;

    const panelWidth = panelEl?.offsetWidth || 200;
    const top = Math.max(edgeMargin, rect.bottom + offsetY);
    const maxHeight = Math.max(160, viewportH - top - edgeMargin);

    if (align === 'right') {
      const desiredRight = Math.max(edgeMargin, viewportW - rect.right);
      const maxRight = Math.max(edgeMargin, viewportW - panelWidth - edgeMargin);
      const right = Math.min(desiredRight, maxRight);
      setCoords({ top, right, maxHeight, ready: true });
    } else {
      const desiredLeft = Math.max(edgeMargin, rect.left);
      const maxLeft = Math.max(edgeMargin, viewportW - panelWidth - edgeMargin);
      const left = Math.min(desiredLeft, maxLeft);
      setCoords({ top, left, maxHeight, ready: true });
    }
  }, [align, offsetY, mobileBottomSheet, triggerRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords((prev) => ({ ...prev, ready: false }));
      return;
    }

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const renderAsBottomSheet = mobileBottomSheet && isMobileViewport;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9998] ${backdropClassName}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        style={
          renderAsBottomSheet
            ? {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                maxHeight: '88dvh',
                ...style,
              }
            : {
                position: 'fixed',
                top: `${coords.top}px`,
                ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
                ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
                maxHeight: `${coords.maxHeight}px`,
                zIndex: 9999,
                visibility: coords.ready ? 'visible' : 'hidden',
                ...style,
              }
        }
        className={className}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

export default PortalDropdown;
