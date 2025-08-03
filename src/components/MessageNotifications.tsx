import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, Megaphone, User, Clock } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { 
  getUnreadMessageCounts, 
  getUnreadMessages, 
  markMessagesAsRead, 
  markAllMessagesAsRead,
  subscribeToMessageChanges,
  type UnreadMessage,
  type UnreadMessageCounts
} from '../lib/messageTracking';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export function MessageNotifications() {
  const { user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessageCounts>({
    announcements: 0,
    discussions: 0,
    privateDiscussions: 0
  });
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const totalUnread = unreadCounts.announcements + unreadCounts.discussions + unreadCounts.privateDiscussions;

  // Load unread counts and messages
  const loadUnreadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading unread data for user:', user.id);
      const [counts, messages] = await Promise.all([
        getUnreadMessageCounts(user.id),
        getUnreadMessages(user.id)
      ]);
      
      console.log('Unread counts:', counts);
      console.log('Unread messages:', messages);
      
      setUnreadCounts(counts);
      setUnreadMessages(messages);
      
      // Add a test message to see if modal displays correctly
      if (messages.length === 0) {
        console.log('No messages found, modal should show empty state');
      }
    } catch (error) {
      console.error('Error loading unread data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;
    
    loadUnreadData();
    
    const unsubscribe = subscribeToMessageChanges(user.id, () => {
      loadUnreadData();
    });

    return unsubscribe;
  }, [user]);

  // Toggle dropdown
  const toggleDropdown = () => {
    console.log('Toggle clicked, current state:', isOpen);
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      loadUnreadData();
    }
    console.log('Modal should now be:', newState);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    markAllMessagesAsRead();
    setUnreadCounts({
      announcements: 0,
      discussions: 0,
      privateDiscussions: 0
    });
    setUnreadMessages([]);
  };

  // Mark specific type as read
  const handleMarkTypeAsRead = (type: 'announcements' | 'discussions' | 'private_discussions') => {
    markMessagesAsRead(type);
    setUnreadCounts(prev => ({
      ...prev,
      [type === 'private_discussions' ? 'privateDiscussions' : type]: 0
    }));
    setUnreadMessages(prev => prev.filter(msg => msg.type !== type));
  };

  // Get icon for message type
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-blue-500" />;
      case 'discussion':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'private_discussion':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get message type label
  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'discussion':
        return 'Discussion';
      case 'private_discussion':
        return 'Private Message';
      default:
        return 'Message';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  console.log('Rendering MessageNotifications, isOpen:', isOpen, 'totalUnread:', totalUnread);

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </button>
      


      {/* Modal */}
      {isOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 ease-out">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Messages
                    </h3>
                    <p className="text-red-100 text-sm">
                      {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {totalUnread > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Enhanced Summary */}
              {totalUnread > 0 && (
                <div className="mt-4 flex gap-3">
                  {unreadCounts.announcements > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <Megaphone className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">
                        {unreadCounts.announcements} announcement{unreadCounts.announcements !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {unreadCounts.discussions > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">
                        {unreadCounts.discussions} discussion{unreadCounts.discussions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {unreadCounts.privateDiscussions > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <User className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">
                        {unreadCounts.privateDiscussions} private message{unreadCounts.privateDiscussions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Messages List */}
            <div className="max-h-[65vh] overflow-y-auto bg-gray-50 dark:bg-gray-800">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading messages...</p>
                </div>
              ) : unreadMessages.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No new messages</h4>
                  <p className="text-gray-500 dark:text-gray-400">You're all caught up with your notifications!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {unreadMessages.map((message, index) => (
                    <div
                      key={`${message.type}-${message.id}`}
                      className="p-6 hover:bg-white dark:hover:bg-gray-700/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
                            {getMessageIcon(message.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                {message.title}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {message.sender_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(message.created_at)}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                                  {getMessageTypeLabel(message.type)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleMarkTypeAsRead(message.type)}
                              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
 } 