import { supabase } from '../lib/supabase';

    export const integrationService = {
      async getApiKeys(orgId) {
        const { data, error } = await supabase
          .from('organization_api_keys')
          .select('*')
          .eq('organization_id', orgId);

        return { data, error: error?.message };
      },

      async generateKey(orgId, name) {
        const prefix = 'fms_';
        const random = Math.random().toString(36).substring(2, 15);
        const secret = `${prefix}${random}`;

        const { data, error } = await supabase
          .from('organization_api_keys')
          .insert([{
            organization_id: orgId,
            name,
            key_prefix: prefix,
            secret_hash: secret // In production, hash this
          }])
          .select()
          .single();

        return { data: { ...data, secret }, error: error?.message };
      },

      async revokeKey(keyId) {
        const { error } = await supabase
          .from('organization_api_keys')
          .delete()
          .eq('id', keyId);

        return { error: error?.message };
      }
    };