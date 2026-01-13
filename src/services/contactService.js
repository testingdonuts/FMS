import { supabase } from '../lib/supabase';

export const contactService = {
  async submitMessage(messageData) {
    // Logic to determine priority based on sender's org tier
    let priorityLevel = 'standard';
    
    // Check if sender is an org owner with a Pro/Teams tier
    const { data: userProfile } = await supabase.auth.getUser();
    if (userProfile?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userProfile.user.id)
        .single();
        
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_tier')
          .eq('id', profile.organization_id)
          .single();
          
        if (org?.subscription_tier === 'Professional') priorityLevel = 'priority';
        if (org?.subscription_tier === 'Teams') priorityLevel = 'urgent';
      }
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        ...messageData,
        priority_level: priorityLevel
      }])
      .select()
      .single();

    return { data, error: error?.message };
  }
};