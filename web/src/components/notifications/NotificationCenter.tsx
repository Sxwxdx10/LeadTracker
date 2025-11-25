'use client';

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Notification } from '@/types/notification';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateParams,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000,
    initialParams: { pageNumber: 1, pageSize: 20 },
  });

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && showUnreadOnly) {
      updateParams({ unreadOnly: true });
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to related entity if applicable
    if (notification.relatedTaskId) {
      // Navigate to task details
      window.location.href = `/tasks/${notification.relatedTaskId}`;
    } else if (notification.relatedLeadId) {
      // Navigate to lead details
      window.location.href = `/leads/${notification.relatedLeadId}`;
    }
  };

  const toggleUnreadOnly = () => {
    const newValue = !showUnreadOnly;
    setShowUnreadOnly(newValue);
    if (newValue) {
      updateParams({ unreadOnly: true });
    } else {
      updateParams({ unreadOnly: false });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TaskReminder':
        return '🔔';
      case 'TaskOverdue':
        return '⚠️';
      case 'TaskAssigned':
        return '📋';
      case 'LeadUpdated':
        return '🔄';
      default:
        return '📢';
    }
  };

  const displayedNotifications = notifications || [];

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="px-4 py-2 border-b border-gray-200">
              <button
                onClick={toggleUnreadOnly}
                className={`text-sm px-3 py-1 rounded ${
                  showUnreadOnly
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {showUnreadOnly ? 'Non lus seulement' : 'Toutes'}
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement...
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-brand-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="text-brand-600 hover:text-brand-700 flex-shrink-0"
                              title="Marquer comme lu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="text-gray-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {displayedNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Voir toutes les notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

