/**
 * Accessibility Utilities for FitMySeat
 * Provides helper functions and hooks for improving accessibility
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Announces a message to screen readers
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Hook for managing focus trap within a modal/dialog
 * @param {boolean} isOpen - Whether the trap is active
 * @returns {React.RefObject} - Ref to attach to the container element
 */
export const useFocusTrap = (isOpen) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when opened
    firstElement?.focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
};

/**
 * Hook for keyboard navigation in lists/grids
 * @param {number} itemCount - Total number of items
 * @param {function} onSelect - Callback when item is selected
 * @returns {object} - Props to spread on list items and current index
 */
export const useKeyboardNavigation = (itemCount, onSelect) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setCurrentIndex(prev => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setCurrentIndex(prev => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex);
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(itemCount - 1);
        break;
    }
  }, [itemCount, currentIndex, onSelect]);

  return { currentIndex, setCurrentIndex, handleKeyDown };
};

/**
 * Hook to detect user's motion preference
 * @returns {boolean} - True if user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook to detect user's color scheme preference
 * @returns {string} - 'dark' or 'light'
 */
export const usePrefersColorScheme = () => {
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e) => setColorScheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return colorScheme;
};

/**
 * Creates accessible button props
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @returns {object} - Props to spread on button element
 */
export const getAccessibleButtonProps = (onClick, disabled = false) => ({
  onClick,
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  },
  role: 'button',
  tabIndex: disabled ? -1 : 0,
  'aria-disabled': disabled,
});

/**
 * Generates unique IDs for form fields
 * @param {string} prefix - Prefix for the ID
 * @returns {object} - Object with id, labelId, and errorId
 */
let idCounter = 0;
export const generateFieldIds = (prefix = 'field') => {
  const id = `${prefix}-${++idCounter}`;
  return {
    id,
    labelId: `${id}-label`,
    errorId: `${id}-error`,
    descriptionId: `${id}-description`,
  };
};

/**
 * Screen reader only class (for CSS)
 * Add this to your CSS:
 * 
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border: 0;
 * }
 */

// Add missing useState import note
import { useState } from 'react';
