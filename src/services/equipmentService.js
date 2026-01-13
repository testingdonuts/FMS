import { supabase } from '../lib/supabase';

export const equipmentService = {
  async createEquipment(equipmentData, organizationId) {
    const payload = {
      organization_id: organizationId,
      name: equipmentData.name,
      description: equipmentData.description,
      category: equipmentData.category,
      rental_price_per_day: parseFloat(equipmentData.rentalPricePerDay || 0),
      deposit_amount: parseFloat(equipmentData.depositAmount || 0),
      current_condition: equipmentData.currentCondition,
      availability_status: equipmentData.availabilityStatus,
      image_urls: equipmentData.imageUrls,
      specifications: equipmentData.specifications,
    };

    const { data, error } = await supabase
      .from('equipment')
      .insert([payload])
      .select()
      .single();

    return { data, error: error?.message };
  },

  async updateEquipment(equipmentId, equipmentData) {
    const payload = {
      name: equipmentData.name,
      description: equipmentData.description,
      category: equipmentData.category,
      rental_price_per_day: parseFloat(equipmentData.rentalPricePerDay || 0),
      deposit_amount: parseFloat(equipmentData.depositAmount || 0),
      current_condition: equipmentData.currentCondition,
      availability_status: equipmentData.availabilityStatus,
      image_urls: equipmentData.imageUrls,
      specifications: equipmentData.specifications,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('equipment')
      .update(payload)
      .eq('id', equipmentId)
      .select()
      .single();

    return { data, error: error?.message };
  },

  async getOrganizationEquipment(organizationId) {
    if (!organizationId) return { data: [], error: 'Organization ID is required' };
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message };
  },

  async getAvailableEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, organization:organizations(name, id)')
      .eq('availability_status', true);
    return { data: data || [], error: error?.message };
  },

  async checkAvailability(equipmentId, startDate, endDate) {
    const { data, error } = await supabase.rpc('check_equipment_availability', {
      p_equipment_uuid: equipmentId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    // The RPC returns a boolean directly
    return { data: data === true, error: error?.message };
  },

  async createRental(rentalData) {
    const payload = {
      equipment_id: rentalData.equipmentId,
      parent_id: rentalData.renterId,
      start_date: rentalData.startDate,
      end_date: rentalData.endDate,
      total_price: rentalData.totalPrice,
      platform_fee: rentalData.platformFee || 0,
      deposit_amount: rentalData.depositAmount,
      status: rentalData.status || 'pending',
      notes: rentalData.notes,
      payment_status: 'unpaid',
      parent_first_name: rentalData.parentFirstName,
      parent_last_name: rentalData.parentLastName,
      contact_phone: rentalData.contactPhone,
      parent_address: rentalData.parentAddress
    };

    const { data, error } = await supabase
      .from('equipment_rentals')
      .insert([payload])
      .select()
      .single();

    return { data, error: error?.message };
  },

  async deleteEquipment(equipmentId) {
    const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);
    return { error: error?.message };
  },

  async getOrganizationRentals(organizationId) {
    const { data, error } = await supabase.rpc('get_organization_rentals', {
      p_org_id: organizationId
    });
    return { data: data || [], error: error?.message };
  },

  async getMaintenanceLogs(organizationId) {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*, equipment(name, category)')
      .eq('organization_id', organizationId)
      .order('service_date', { ascending: false });
    return { data: data || [], error: error?.message };
  },

  async addMaintenanceLog(logData) {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert([{
        equipment_id: logData.equipmentId,
        organization_id: logData.organizationId,
        type: logData.type,
        description: logData.description,
        cost: logData.cost,
        service_date: logData.serviceDate,
        performed_by: logData.performedBy,
        status: logData.status
      }])
      .select()
      .single();
    return { data, error: error?.message };
  }
};