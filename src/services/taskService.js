import supabase from '../supabase/supabase';

export const taskService = {
  async getMyTasks(userId) {
    // Find team_member id for this user
    const { data: tm, error: tmErr } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (tmErr) return { data: [], error: tmErr.message };
    if (!tm?.id) return { data: [], error: null };

    const { data, error } = await supabase
      .from('team_tasks')
      .select('*')
      .eq('assignee_id', tm.id)
      .order('due_date', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  async getOrgTasks(organizationId) {
    const { data, error } = await supabase
      .from('team_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },

  async createTask(task) {
    const payload = {
      organization_id: task.organization_id || task.organizationId,
      assignee_id: task.assignee_id || task.assigneeId,
      title: task.title,
      description: task.description || null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date || task.dueDate || null,
      task_type: task.task_type || task.type || 'other',
      booking_id: task.booking_id || task.bookingId || null,
      equipment_id: task.equipment_id || task.equipmentId || null,
      rental_id: task.rental_id || task.rentalId || null,
      context_label: task.context_label || task.contextLabel || null,
      created_by: task.created_by || task.createdBy || null,
    };
    const { data, error } = await supabase
      .from('team_tasks')
      .insert([payload])
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  async updateTask(id, updates) {
    const { data, error } = await supabase
      .from('team_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message || null };
  },

  async deleteTask(id) {
    const { error } = await supabase
      .from('team_tasks')
      .delete()
      .eq('id', id);
    return { error: error?.message || null };
  }
};

export default taskService;
