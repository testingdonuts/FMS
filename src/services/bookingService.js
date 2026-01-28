import { supabase } from '../lib/supabase';
import { calculatePlatformFee } from '../utils/feeUtils';

export const bookingService = {
  // ... existing service methods ...

  async createEquipmentRental(rentalData) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', rentalData.organizationId)
      .single();

    const platformFee = calculatePlatformFee(rentalData.totalPrice, org?.subscription_tier);

    const payload = {
      equipment_id: rentalData.equipmentId,
      parent_id: rentalData.renterId,
      start_date: rentalData.startDate,
      end_date: rentalData.endDate,
      total_price: rentalData.totalPrice,
      platform_fee: platformFee,
      deposit_amount: rentalData.depositAmount,
      pickup_address: rentalData.pickupAddress,
      return_method: rentalData.returnMethod,
      notes: rentalData.notes,
      payment_status: 'unpaid',
      parent_first_name: rentalData.parentFirstName,
      parent_last_name: rentalData.parentLastName,
      contact_phone: rentalData.contactPhone,
      parent_address: rentalData.parentAddress // Added parent address
    };

    const { data, error } = await supabase
      .from('equipment_rentals')
      .insert([payload])
      .select()
      .single();

    return { data, error: error?.message };
  },

  async updateEquipmentRental(rentalId, updates) {
    const { data, error } = await supabase
      .from('equipment_rentals')
      .update(updates)
      .eq('id', rentalId)
      .select()
      .single();
    
    return { data, error: error?.message };
  },

  async processPayment(id, type) {
    const table = type === 'booking' ? 'service_bookings' : 'equipment_rentals';
    const { data, error } = await supabase
      .from(table)
      .update({ payment_status: 'paid' })
      .eq('id', id)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async getServiceBookings(filters = {}) {
    if (filters.organizationId) {
      const { data, error } = await supabase.rpc('get_organization_bookings', { p_org_id: filters.organizationId });
      return { data, error: error?.message };
    }
    if (filters.parentId) {
      const { data, error } = await supabase.rpc('get_parent_bookings', { p_parent_id: filters.parentId });
      return { data, error: error?.message };
    }
    return { data: [], error: 'A user or organization context is required.' };
  },

  async getBookingStats(organizationId, dateFrom, dateTo) {
    try {
      const { data, error } = await supabase.rpc('get_booking_stats', {
        p_org_id: organizationId,
        p_from_date: dateFrom,
        p_to_date: dateTo
      });
      if (error) throw error;
      return { data: data ? data[0] : null, error: null };
    } catch (err) {
      console.error("Error fetching booking stats:", err);
      return { data: null, error: err.message };
    }
  },

  async getEquipmentRentals(filters = {}) {
    if (filters.renterId) {
      const { data, error } = await supabase.rpc('get_parent_rentals', { p_parent_id: filters.renterId });
      return { data, error: error?.message };
    }
    if (filters.organizationId) {
      const { data, error } = await supabase.rpc('get_organization_rentals', { p_org_id: filters.organizationId });
      return { data, error: error?.message };
    }
    return { data: [], error: 'A user or organization context is required.' };
  },

  async getBookedSlots(orgId, date) {
    const { data, error } = await supabase
      .from('service_bookings')
      .select('booking_date')
      .eq('org_id', orgId)
      .gte('booking_date', `${date}T00:00:00Z`)
      .lte('booking_date', `${date}T23:59:59Z`)
      .not('status', 'eq', 'cancelled');

    if (error) return { data: [], error: error.message };
    return { data: data.map(b => new Date(b.booking_date).toISOString().substring(11, 16)), error: null };
  },

  async createServiceBooking(bookingData) {
    const { data: existing } = await supabase
      .from('service_bookings')
      .select('id')
      .eq('org_id', bookingData.orgId)
      .eq('booking_date', bookingData.scheduledDate)
      .not('status', 'eq', 'cancelled')
      .maybeSingle();

    if (existing) {
      return { data: null, error: 'This time slot has just been booked by someone else.' };
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', bookingData.orgId)
      .single();

    const platformFee = calculatePlatformFee(bookingData.totalPrice, org?.subscription_tier);

    const payload = {
      org_id: bookingData.orgId,
      service_id: bookingData.serviceId,
      parent_id: bookingData.parentId,
      technician_id: bookingData.technicianId,
      booking_date: bookingData.scheduledDate,
      total_price: bookingData.totalPrice,
      platform_fee: platformFee,
      child_name: bookingData.childName,
      child_age: bookingData.childAge,
      vehicle_info: bookingData.vehicleInfo,
      service_address: bookingData.address,
      contact_phone: bookingData.phone,
      notes: bookingData.notes,
      parent_first_name: bookingData.parentFirstName,
      parent_last_name: bookingData.parentLastName,
      payment_status: 'unpaid'
    };

    const { data, error } = await supabase
      .from('service_bookings')
      .insert([payload])
      .select()
      .single();

    return { data, error: error?.message };
  },

  async updateServiceBooking(bookingId, updates) {
    const dbUpdates = { ...updates };
    if (dbUpdates.address) {
      dbUpdates.service_address = dbUpdates.address;
      delete dbUpdates.address;
    }
    if (dbUpdates.phone) {
      dbUpdates.contact_phone = dbUpdates.phone;
      delete dbUpdates.phone;
    }

    const { data, error } = await supabase
      .from('service_bookings')
      .update(dbUpdates)
      .eq('id', bookingId)
      .select()
      .single();

    return { data, error: error?.message };
  }
};