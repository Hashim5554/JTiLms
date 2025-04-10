import { supabase } from './supabase';

export async function createNotification(
  userId: string,
  type: 'announcement' | 'subject' | 'library' | 'record' | 'club',
  referenceId: string
) {
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

  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('type', type)
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return data?.length || 0;
}