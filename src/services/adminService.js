import { supabase } from '../lib/supabase';

export const adminService = {
  async getGlobalStats() {
    const { data, error } = await supabase.rpc('get_admin_stats');
    return { data: data?.[0], error: error?.message };
  },

  async getAllPayouts() {
    const { data, error } = await supabase.rpc('get_admin_payouts');
    return { data, error: error?.message };
  },

  async updatePayoutStatus(payoutId, status) {
    const { data, error } = await supabase
      .from('payout_requests')
      .update({ 
        status, 
        processed_at: status === 'paid' ? new Date().toISOString() : null 
      })
      .eq('id', payoutId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async getAllOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:profiles!owner_id(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data, error: error?.message };
  },

  async updateOrgVerification(orgId, status, notes = '') {
    const { data, error } = await supabase
      .from('organizations')
      .update({ verification_status: status, admin_notes: notes })
      .eq('id', orgId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async getAllUsers(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { data, error: error?.message };
  },

  async getRecentActivity(limit = 20) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles!user_id(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error: error?.message };
  },

  async getPlatformMetrics() {
    const { data, error } = await supabase
      .rpc('get_platform_metrics');
    return { data, error: error?.message };
  },

  async suspendUser(userId, reason = '') {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async activateUser(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'active',
        suspension_reason: null,
        suspended_at: null
      })
      .eq('id', userId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  // ============ REVENUE ANALYTICS ============
  async getRevenueAnalytics(daysBack = 30) {
    const { data, error } = await supabase.rpc('get_revenue_analytics', { days_back: daysBack });
    return { data, error: error?.message };
  },

  // ============ PLATFORM SETTINGS ============
  async getSettings() {
    let { data, error } = await supabase.rpc('get_platform_settings');
    if (error) {
      const result = await supabase
        .from('platform_settings')
        .select('key, value, description, category')
        .order('category', { ascending: true });
      data = result.data;
      error = result.error;
    }
    return { data: data || [], error: error?.message };
  },

  async updateSetting(key, value) {
    let { data, error } = await supabase.rpc('update_platform_setting', {
      setting_key: key,
      setting_value: JSON.stringify(value)
    });
    if (error) {
      const result = await supabase
        .from('platform_settings')
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }
    return { data, error: error?.message };
  },

  // ============ SUPPORT TICKETS ============
  async getTicketStats() {
    const { data, error } = await supabase.rpc('get_ticket_stats');
    return { data: data?.[0], error: error?.message };
  },

  async getAllTickets(status = null) {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!user_id(full_name, email),
        assigned:profiles!assigned_to(full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    return { data, error: error?.message };
  },

  async getTicketResponses(ticketId) {
    const { data, error } = await supabase
      .from('ticket_responses')
      .select(`
        *,
        user:profiles!user_id(full_name)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    return { data, error: error?.message };
  },

  async updateTicketStatus(ticketId, status, assignedTo = null) {
    const updates = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    if (assignedTo) {
      updates.assigned_to = assignedTo;
    }
    
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async addTicketResponse(ticketId, message) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id: ticketId,
        user_id: userData?.user?.id,
        message,
        is_admin_response: true
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  // ============ ANNOUNCEMENTS ============
  async getAnnouncements(includeInactive = true) {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        created_by_user:profiles!created_by(full_name)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    return { data, error: error?.message };
  },

  async createAnnouncement(announcement) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcement,
        created_by: userData?.user?.id
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  async updateAnnouncement(id, updates) {
    const { data, error } = await supabase
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async deleteAnnouncement(id) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    return { error: error?.message };
  },

  // ============ EMAIL / NOTIFICATIONS ============
  async sendEmailToUser(userId, subject, body, emailType = 'general') {
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (!user?.email) {
      return { error: 'User email not found' };
    }

    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        recipient_id: userId,
        recipient_email: user.email,
        subject,
        body,
        email_type: emailType,
        sent_by: userData?.user?.id,
        status: 'sent'
      })
      .select()
      .single();
    
    return { data, error: error?.message };
  },

  async sendBulkEmail(userIds, subject, body, emailType = 'bulk') {
    const results = [];
    for (const userId of userIds) {
      const result = await this.sendEmailToUser(userId, subject, body, emailType);
      results.push({ userId, ...result });
    }
    return { data: results, error: null };
  },

  async getEmailLogs(limit = 50) {
    const { data, error } = await supabase
      .from('email_logs')
      .select(`
        *,
        recipient:profiles!recipient_id(full_name, email),
        sender:profiles!sent_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error: error?.message };
  },

  // ============ BLOG MANAGEMENT ============
  async getBlogPosts(includeUnpublished = true) {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }
    
    const { data, error } = await query;
    return { data, error: error?.message };
  },

  async getBlogPost(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error: error?.message };
  },

  async getBlogPostBySlug(slug) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (data) {
      await supabase
        .from('blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    }
    
    return { data, error: error?.message };
  },

  async createBlogPost(post) {
    const { data: userData } = await supabase.auth.getUser();
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...post,
        slug,
        author_id: userData?.user?.id,
        published_at: post.is_published ? new Date().toISOString() : null
      })
      .select()
      .single();
    return { data, error: error?.message };
  },

  async updateBlogPost(id, updates) {
    const updateData = { 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    if (updates.title) {
      updateData.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    if (updates.is_published) {
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single();
      
      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async deleteBlogPost(id) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    return { error: error?.message };
  },

  async toggleBlogPostPublished(id, isPublished) {
    return this.updateBlogPost(id, { is_published: isPublished });
  },

  async toggleBlogPostFeatured(id, isFeatured) {
    return this.updateBlogPost(id, { is_featured: isFeatured });
  },

  async uploadBlogImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return { data: urlData.publicUrl, error: null };
  }
};
