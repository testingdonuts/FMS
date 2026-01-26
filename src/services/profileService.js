import supabase from '../supabase/supabase';

    /**
     * Get the current user's profile
     */
    export const getProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    };

    /**
     * Update the user's location settings
     * @param {string} userId - The user's UUID
     * @param {object} locationData - { countryCode, countryName, city, state, zipcode }
     */
    export const updateProfileLocation = async (userId, locationData) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            location: locationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating profile location:', error);
        throw error;
      }
    };

    /**
     * Update user's general profile information
     * @param {string} userId - The user's UUID
     * @param {object} profileData - { full_name, phone, address, etc. }
     */
    export const updateProfile = async (userId, profileData) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    };