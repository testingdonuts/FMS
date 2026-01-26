import supabase from '../supabase/supabase';

/**
 * Service for handling all equipment-related operations.
 * This file provides the methods required by EquipmentManagement and EquipmentForm components.
 */
export const equipmentService = {
  /**
   * Fetches all equipment belonging to a specific organization.
   * Required by EquipmentManagement.jsx
   */
  async getOrganizationEquipment(orgId) {
    try {
      if (!orgId) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in getOrganizationEquipment:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Fetches all rentals for an organization's equipment using the RPC function.
   * Required by EquipmentManagement.jsx
   */
  async getOrganizationRentals(orgId) {
    try {
      if (!orgId) throw new Error('Organization ID is required');
      const { data, error } = await supabase.rpc('get_organization_rentals', {
        p_org_id: orgId
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in getOrganizationRentals:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Creates a new equipment record.
   * Required by EquipmentForm.jsx
   */
  async createEquipment(equipmentData, organizationId) {
    try {
      // Map camelCase form data to snake_case database columns
      const dbData = {
        organization_id: organizationId,
        name: equipmentData.name,
        description: equipmentData.description || null,
        category: equipmentData.category,
        rental_price_per_day: parseFloat(equipmentData.rentalPricePerDay) || 0,
        deposit_amount: parseFloat(equipmentData.depositAmount) || 0,
        current_condition: equipmentData.currentCondition || 'Good',
        availability_status: equipmentData.availabilityStatus ?? true,
        image_urls: equipmentData.imageUrls || [],
        specifications: equipmentData.specifications || {},
        availability: equipmentData.availability || { type: 'worldwide' }
      };
      
      const { data, error } = await supabase
        .from('equipment')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in createEquipment:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Updates an existing equipment record.
   */
  async updateEquipment(id, updateData) {
    try {
      // Map camelCase form data to snake_case database columns
      const dbData = {
        name: updateData.name,
        description: updateData.description || null,
        category: updateData.category,
        rental_price_per_day: parseFloat(updateData.rentalPricePerDay) || 0,
        deposit_amount: parseFloat(updateData.depositAmount) || 0,
        current_condition: updateData.currentCondition || 'Good',
        availability_status: updateData.availabilityStatus ?? true,
        image_urls: updateData.imageUrls || [],
        specifications: updateData.specifications || {},
        availability: updateData.availability || { type: 'worldwide' }
      };
      
      const { data, error } = await supabase
        .from('equipment')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEquipment:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Deletes an equipment record.
   */
  async deleteEquipment(id) {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error in deleteEquipment:', error);
      return { error: error.message };
    }
  },

  /**
   * Fetches all available equipment for the homepage/listing page.
   */
  async getAvailableEquipment() {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('availability_status', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in getAvailableEquipment:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Checks if equipment is available for a date range using the RPC function.
   */
  async checkAvailability(equipmentId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('check_equipment_availability', {
        p_equipment_uuid: equipmentId,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (error) throw error;
      return data; // Returns boolean
    } catch (error) {
      console.error('Error in checkAvailability:', error);
      return false;
    }
  },

  async getEquipmentById(id) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, organizations(*)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createRental(rentalData) {
    try {
      const { data, error } = await supabase
        .from('equipment_rentals')
        .insert([rentalData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error in createRental:', error);
      return { data: null, error };
    }
  }
};

export default equipmentService;