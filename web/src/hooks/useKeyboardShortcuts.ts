import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrlKey !== undefined ? s.ctrlKey === (event.ctrlKey || event.metaKey) : true;
        const shiftMatch = s.shiftKey !== undefined ? s.shiftKey === event.shiftKey : true;
        const altMatch = s.altKey !== undefined ? s.altKey === event.altKey : true;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common shortcuts for Kanban
export const KANBAN_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    action: () => console.log('Switch to Kanban view'),
    description: 'Switch to Kanban view'
  },
  {
    key: 't',
    ctrlKey: true,
    action: () => console.log('Switch to Table view'),
    description: 'Switch to Table view'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: () => console.log('Create new lead'),
    description: 'Create new lead'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => console.log('Focus search'),
    description: 'Focus search'
  },
  {
    key: '/',
    action: () => console.log('Quick search'),
    description: 'Quick search'
  },
  {
    key: 'Escape',
    action: () => console.log('Close modal'),
    description: 'Close modal'
  },
  {
    key: '?',
    ctrlKey: true,
    action: () => console.log('Show shortcuts'),
    description: 'Show shortcuts help'
  }
];

