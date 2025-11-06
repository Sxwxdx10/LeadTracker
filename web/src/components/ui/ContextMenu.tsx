'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  className?: string;
}

export function ContextMenu({ items, className }: ContextMenuProps) {
  return null; // This is a controlled component, actual menu will be rendered by useContextMenu hook
}

interface UseContextMenuReturn {
  menuRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  position: { x: number; y: number };
  openMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
  menuItems: ContextMenuItem[];
}

export function useContextMenu(): UseContextMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const openMenu = (event: React.MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setMenuItems(items);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return { menuRef, isOpen, position, openMenu, closeMenu, menuItems };
}

interface ContextMenuPortalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenuPortal({ isOpen, position, items, onClose }: ContextMenuPortalProps) {
  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors",
                  "hover:bg-gray-100",
                  item.disabled && "opacity-50 cursor-not-allowed",
                  item.destructive && "text-red-600 hover:bg-red-50"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

