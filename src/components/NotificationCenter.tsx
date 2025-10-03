import React, { useEffect,useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose, notifications }) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    // When the panel opens, mark all unread notifications as read
    if (open && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds)
          .then();
      }
    }
    // eslint-disable-next-line
  }, [open]);
  
  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const latestDate = notifications.length > 0
    ? notifications
        .map(n => n.created_at)
        .filter(Boolean)
        .sort()
        .reverse()[0]
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Notification Panel */}
            <aside
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-xl bg-white shadow-xl transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '50vw', maxWidth: 480, minWidth: 320 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)] px-6 py-4 space-y-4">
          {localNotifications.length === 0 ? (
            <div className="text-gray-500 text-center mt-12">No notifications</div>
          ) : (
            localNotifications.map((n) => (
              <div
                key={n.id}
                className={`relative border rounded-lg p-4 shadow-sm transition-colors ${
                  n.is_read
                    ? 'bg-gray-200 border-gray-300'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-900">{n.title}</div>
                  <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
                <div className="text-gray-700 text-sm mt-1">{n.message}</div>
                <button
                  className="absolute bottom-2 right-2 p-1 rounded-full hover:bg-gray-300 transition-colors"
                  aria-label="Delete notification"
                  onClick={() => handleDelete(n.id)}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationCenter;