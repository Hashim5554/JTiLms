import { supabase } from './supabase';

export async function createNotification(
  userId: string,
  type: 'announcement' | 'subject' | 'library' | 'record' | 'club',
  referenceId: string
) {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      type,
      reference_id: referenceId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markNotificationsAsRead(type: string) {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;

  if (!userId) return; // Silently return if no user

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('type', type)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getUnreadNotificationCount(type: string) {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;

  if (!userId) return 0; // Return 0 if no user

  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('type', type)
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return data?.length || 0;
}

export async function fetchUnreadNotifications(userId: string) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, created_at')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function notifyDiscussionParticipants(classId: string, senderId: string, message: string) {
  const { data: users, error } = await supabase
    .from('class_assignments')
    .select('user_id')
    .eq('class_id', classId)
    .neq('user_id', senderId);

  if (error) throw error;

  const notifications = users.map(user => ({
    user_id: user.user_id,
    type: 'discussion',
    reference_id: classId,
    message: `New discussion message: ${message}`
  }));

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (insertError) throw insertError;
}