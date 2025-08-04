import { supabase } from './supabase';

export interface UnreadMessageCounts {
  announcements: number;
  discussions: number;
  privateDiscussions: number;
}

export interface UnreadMessage {
  id: string;
  type: 'announcement' | 'discussion' | 'private_discussion';
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  sender_name: string;
}

// Track when user last viewed each type of content
const getLastViewedKey = (type: string) => `last_viewed_${type}`;
const getLastViewedTime = (type: string): Date => {
  const stored = localStorage.getItem(getLastViewedKey(type));
  return stored ? new Date(stored) : new Date(0);
};

const setLastViewedTime = (type: string) => {
  localStorage.setItem(getLastViewedKey(type), new Date().toISOString());
};

// Get unread announcement count
export const getUnreadAnnouncementCount = async (userId: string, classId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const lastViewed = getLastViewedTime('announcements');
  
  try {
    let query = supabase
      .from('announcements')
      .select('id')
      .gt('created_at', lastViewed.toISOString());
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting unread announcement count:', error);
    return 0;
  }
};

// Get unread discussion count
export const getUnreadDiscussionCount = async (userId: string, classId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const lastViewed = getLastViewedTime('discussions');
  
  try {
    let query = supabase
      .from('discussions')
      .select('id')
      .gt('created_at', lastViewed.toISOString())
      .neq('created_by', userId);
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting unread discussion count:', error);
    return 0;
  }
};

// Get unread private discussion count
export const getUnreadPrivateDiscussionCount = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  const lastViewed = getLastViewedTime('private_discussions');
  
  try {
    const { data, error } = await supabase
      .from('private_discussions')
      .select('id')
      .gt('created_at', lastViewed.toISOString())
      .eq('recipient_id', userId)
      .neq('created_by', userId);
    
    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting unread private discussion count:', error);
    return 0;
  }
};

// Get all unread message counts
export const getUnreadMessageCounts = async (userId: string, classId?: string): Promise<UnreadMessageCounts> => {
  console.log('Getting unread counts for user:', userId);
  
  const [announcements, discussions, privateDiscussions] = await Promise.all([
    getUnreadAnnouncementCount(userId, classId),
    getUnreadDiscussionCount(userId, classId),
    getUnreadPrivateDiscussionCount(userId)
  ]);
  
  return {
    announcements,
    discussions,
    privateDiscussions
  };
};

// Get unread messages with details
export const getUnreadMessages = async (userId: string, classId?: string): Promise<UnreadMessage[]> => {
  if (!userId) return [];
  
  const lastViewedAnnouncements = getLastViewedTime('announcements');
  const lastViewedDiscussions = getLastViewedTime('discussions');
  const lastViewedPrivateDiscussions = getLastViewedTime('private_discussions');
  
  try {
    console.log('Getting unread messages for user:', userId);
    console.log('Last viewed times:', {
      announcements: lastViewedAnnouncements,
      discussions: lastViewedDiscussions,
      privateDiscussions: lastViewedPrivateDiscussions
    });
    
    const [announcements, discussions, privateDiscussions] = await Promise.all([
      // Get unread announcements
      supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          created_by,
          profiles:created_by (username)
        `)
        .gt('created_at', lastViewedAnnouncements.toISOString())
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Get unread discussions
      supabase
        .from('discussions')
        .select(`
          id,
          content,
          created_at,
          created_by,
          profiles:created_by (username)
        `)
        .gt('created_at', lastViewedDiscussions.toISOString())
        .neq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Get unread private discussions - fixed query syntax
      supabase
        .from('private_discussions')
        .select(`
          id,
          content,
          created_at,
          created_by,
          profiles:created_by (username)
        `)
        .gt('created_at', lastViewedPrivateDiscussions.toISOString())
        .eq('recipient_id', userId)
        .neq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);
    
    const messages: UnreadMessage[] = [];
    
    // Process announcements
    if (announcements.data) {
      announcements.data.forEach(announcement => {
        messages.push({
          id: announcement.id,
          type: 'announcement',
          title: announcement.title,
          content: announcement.content,
          created_at: announcement.created_at,
          created_by: announcement.created_by,
          sender_name: announcement.profiles?.username || 'Unknown'
        });
      });
    }
    
    // Process discussions
    if (discussions.data) {
      discussions.data.forEach(discussion => {
        messages.push({
          id: discussion.id,
          type: 'discussion',
          title: 'New Discussion Message',
          content: discussion.content,
          created_at: discussion.created_at,
          created_by: discussion.created_by,
          sender_name: discussion.profiles?.username || 'Unknown'
        });
      });
    }
    
    // Process private discussions
    if (privateDiscussions.data) {
      privateDiscussions.data.forEach(privateDiscussion => {
        messages.push({
          id: privateDiscussion.id,
          type: 'private_discussion',
          title: 'New Private Message',
          content: privateDiscussion.content,
          created_at: privateDiscussion.created_at,
          created_by: privateDiscussion.created_by,
          sender_name: privateDiscussion.profiles?.username || 'Unknown'
        });
      });
    }
    
    // Sort by creation date (newest first)
    return messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
  } catch (error) {
    console.error('Error getting unread messages:', error);
    return [];
  }
};

// Mark messages as read (update last viewed time)
export const markMessagesAsRead = (type: 'announcements' | 'discussions' | 'private_discussions') => {
  setLastViewedTime(type);
};

// Mark all messages as read
export const markAllMessagesAsRead = () => {
  setLastViewedTime('announcements');
  setLastViewedTime('discussions');
  setLastViewedTime('private_discussions');
};

// Reset all last viewed times (for testing)
export const resetLastViewedTimes = () => {
  localStorage.removeItem('last_viewed_announcements');
  localStorage.removeItem('last_viewed_discussions');
  localStorage.removeItem('last_viewed_private_discussions');
};

// Subscribe to real-time changes
export const subscribeToMessageChanges = (userId: string, callback: () => void) => {
  const channel = supabase.channel('message_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'discussions'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'private_discussions',
        filter: `created_by=neq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}; 