import React,{useState,useEffect} from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {serviceManagementService} from '../../services/serviceManagementService';
import {bookingService} from '../../services/bookingService';
import {auditService} from '../../services/auditService';
import {notificationService} from '../../services/notificationService';
import {calculatePlatformFee} from '../../utils/feeUtils';
import BookingConfirmation from './BookingConfirmation';
import TimeSlotPicker from './TimeSlotPicker';
import AuditTrail from './AuditTrail';

const {FiCalendar,FiSave,FiX,FiRefreshCw,FiCheck,FiAlertCircle,FiClock,FiActivity,FiInfo}=FiIcons;

const ServiceBookingForm=({onClose,onSuccess,organizationId,userId,initialService=null,bookingToEdit=null,userRole})=> {
  const [formData,setFormData]=useState({
    serviceId: initialService?.id || '',
    scheduledDate: '',
    scheduledTime: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    vehicleInfo: '',
    address: '',
    notes: '',
  });
  const [selectedOrg,setSelectedOrg]=useState(null);
  const [services,setServices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [bookedSlots,setBookedSlots]=useState([]);
  const [loadingSlots,setLoadingSlots]=useState(false);
  const [error,setError]=useState('');
  const [showConfirmation,setShowConfirmation]=useState(false);
  const [confirmedBooking,setConfirmedBooking]=useState(null);
  const [activeTab,setActiveTab]=useState('details');

  const isOrgRole=userRole==='organization' || userRole==='team_member';
  const isParentRole=userRole==='parent';
  const status=bookingToEdit?.status;
  const isReadOnly=(isOrgRole && !!bookingToEdit) || (isParentRole && !!bookingToEdit && status !=='pending');

  useEffect(()=> {
    loadInitialData();
  },[organizationId,bookingToEdit]);

  const loadInitialData=async ()=> {
    setLoading(true);
    setError('');
    try {
      let orgIdToLoad=organizationId || bookingToEdit?.org_id;
      if (bookingToEdit) {
        const dateObj=new Date(bookingToEdit.booking_date);
        setFormData({...formData,
          serviceId: bookingToEdit.service_id,
          scheduledDate: dateObj.toISOString().split('T')[0],
          scheduledTime: dateObj.toISOString().substring(11,16),
          parentFirstName: bookingToEdit.parent_first_name || '',
          parentLastName: bookingToEdit.parent_last_name || '',
          parentPhone: bookingToEdit.contact_phone || '',
          vehicleInfo: bookingToEdit.vehicle_info || '',
          address: bookingToEdit.service_address || '',
          notes: bookingToEdit.notes || '',
        });
      }

      if (orgIdToLoad) {
        const {data: orgData, error: orgError}=await serviceManagementService.getOrganizationById(orgIdToLoad);
        if (orgError) throw new Error(`Failed to load organization: ${orgError}`);
        setSelectedOrg(orgData);
        
        const {data: servicesData, error: servicesError}=await serviceManagementService.getOrganizationServices(orgIdToLoad);
        if (servicesError) throw new Error(`Failed to load services: ${servicesError}`);
        if (servicesData) setServices(servicesData.filter(s=> s.is_active || (bookingToEdit && s.id===bookingToEdit.service_id)));
      }
    } catch (err) {
      console.error('loadInitialData error:', err);
      setError(err.message || 'Failed to load booking data');
    }
    setLoading(false);
  };

  const checkAvailability=async ()=> {
    setLoadingSlots(true);
    try {
      const {data, error}=await bookingService.getBookedSlots(selectedOrg.id,formData.scheduledDate);
      if (error) throw new Error(`Failed to check availability: ${error}`);
      if (data) setBookedSlots(data);
    } catch (err) {
      console.error('checkAvailability error:', err);
      setError(err.message || 'Failed to check availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(()=> {
    if (selectedOrg && formData.scheduledDate && !isReadOnly) checkAvailability();
  },[selectedOrg,formData.scheduledDate]);

  const handleSubmit=async (e)=> {
    e.preventDefault();
    if (isOrgRole && status==='pending') {
      handleStatusChange('confirmed',true);
      return;
    }
    if (isReadOnly) return;
    setLoading(true);
    try {
      const selectedService=services.find(s=> s.id===formData.serviceId);
      const bookingPayload={
        org_id: selectedOrg.id,
        service_id: formData.serviceId,
        parent_id: userId,
        booking_date: `${formData.scheduledDate}T${formData.scheduledTime}:00.000Z`,
        total_price: selectedService.price || 0,
        vehicle_info: formData.vehicleInfo,
        service_address: formData.address,
        contact_phone: formData.parentPhone,
        notes: formData.notes,
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
      };

      const result=bookingToEdit
        ? await bookingService.updateServiceBooking(bookingToEdit.id,bookingPayload)
        : await bookingService.createServiceBooking(bookingPayload);

      if (result.error) setError(result.error);
      else {
        const action=bookingToEdit ? 'update' : 'create';
        await auditService.logAction({
          bookingId: result.data.id,
          action,
          newStatus: result.data.status,
          actorId: userId,
          actorRole: userRole
        });
        if (!bookingToEdit) {
          await notificationService.createNotification(
            selectedOrg.owner_id,
            'New Booking Received',
            `A new booking for ${selectedService.name} has been placed.`,
            'booking_created'
          );
        }
        if (bookingToEdit) onSuccess();
        else {
          setConfirmedBooking({...result.data,service: selectedService});
          setShowConfirmation(true);
        }
      }
    } catch (err) {
      console.error('ServiceBookingForm error:', err);
      setError(err.message || 'An error occurred.');
    }
    setLoading(false);
  };

  const handleStatusChange=async (newStatus,skipConfirm=false)=> {
    if (!bookingToEdit) return;
    if (!skipConfirm && !confirm(`Are you sure you want to ${newStatus} this booking?`)) return;
    setLoading(true);
    const {error}=await bookingService.updateServiceBooking(bookingToEdit.id,{status: newStatus});
    if (!error) {
      await auditService.logAction({
        bookingId: bookingToEdit.id,
        action: 'status_update',
        oldStatus: bookingToEdit.status,
        newStatus,
        actorId: userId,
        actorRole: userRole
      });
      await notificationService.createNotification(
        bookingToEdit.parent_id,
        `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        `Your booking for ${bookingToEdit.service?.name} has been ${newStatus}.`,
        `booking_${newStatus}`
      );
      onSuccess();
    } else {
      setError(error);
      setLoading(false);
    }
  };

  const selectedService=services.find(s=> s.id===formData.serviceId);
  const platformFee=selectedService ? calculatePlatformFee(selectedService.price,selectedOrg?.subscription_tier) : 0;

  if (showConfirmation) return <BookingConfirmation booking={confirmedBooking} onClose={onSuccess} />;

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{scale: 0.9,opacity: 0}} animate={{scale: 1,opacity: 1}} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-50 p-6 flex justify-between items-center z-10">
          <div className="flex space-x-6">
            <button
              onClick={()=> setActiveTab('details')}
              className={`text-lg font-bold transition-colors ${activeTab==='details' ? 'text-navy' : 'text-gray-400'}`}
            >
              Details
            </button>
            {bookingToEdit && (
              <button
                onClick={()=> setActiveTab('audit')}
                className={`text-lg font-bold transition-colors flex items-center ${activeTab==='audit' ? 'text-navy' : 'text-gray-400'}`}
              >
                <SafeIcon icon={FiActivity} className="mr-2" /> History
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><SafeIcon icon={FiX} className="text-xl" /></button>
        </div>

        <div className="p-8">
          {activeTab==='details' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center space-x-3"><SafeIcon icon={FiAlertCircle} /><p className="text-sm font-medium">{error}</p></div>}
              
              <div className="space-y-4">
                <label className="block text-sm font-bold text-navy uppercase tracking-wider">Service Type</label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={(e)=> setFormData({...formData,serviceId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  required
                  disabled={isReadOnly}
                >
                  <option value="">Select service...</option>
                  {services.map(s=> <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                </select>
              </div>

              <div className={`p-6 rounded-2xl border ${isReadOnly ? 'bg-gray-50 border-gray-100' : 'bg-teal-50/50 border-teal-100'}`}>
                <h3 className="text-lg font-bold text-navy mb-4 flex items-center"><SafeIcon icon={FiCalendar} className="mr-2 text-teal-600" /> Schedule</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-teal-700 mb-1 uppercase">Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={(e)=> setFormData({...formData,scheduledDate: e.target.value})}
                      className="w-full p-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-teal-500"
                      required
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-teal-700 mb-1 uppercase">Time Slot</label>
                    {isReadOnly ? (
                      <div className="bg-white p-3 rounded-xl border border-gray-100 font-bold text-gray-700 flex items-center h-[50px]"><SafeIcon icon={FiClock} className="mr-2 text-gray-400" /> {formData.scheduledTime}</div>
                    ) : (
                      <TimeSlotPicker
                        selectedTime={formData.scheduledTime}
                        onSelect={(time)=> setFormData(prev=> ({...prev,scheduledTime: time}))}
                        bookedSlots={bookedSlots}
                        loading={loadingSlots}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider">Contact</h4>
                  <input type="text" placeholder="First Name" value={formData.parentFirstName} onChange={(e)=> setFormData({...formData,parentFirstName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" required disabled={isReadOnly} />
                  <input type="text" placeholder="Last Name" value={formData.parentLastName} onChange={(e)=> setFormData({...formData,parentLastName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" required disabled={isReadOnly} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider">Vehicle/Location</h4>
                  <input type="text" placeholder="Vehicle Details" value={formData.vehicleInfo} onChange={(e)=> setFormData({...formData,vehicleInfo: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" required disabled={isReadOnly} />
                  <input type="text" placeholder="Service Address" value={formData.address} onChange={(e)=> setFormData({...formData,address: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl" required disabled={isReadOnly} />
                </div>
              </div>

              {/* Pricing Summary */}
              {selectedService && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Service Price:</span>
                    <span className="font-bold text-navy">${selectedService.price}</span>
                  </div>
                  {/* Only show Platform Fee to Organization members,and explicitly mark it as deducted/operational */}
                  {isOrgRole && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center">
                        Platform Fee (Deducted):
                        <div className="ml-1 group relative">
                          <SafeIcon icon={FiInfo} className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-navy text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {selectedOrg?.subscription_tier} Tier fee. This amount is deducted from your payout.
                          </div>
                        </div>
                      </span>
                      <span className="font-medium text-red-400">-${platformFee}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-navy">Total Amount:</span>
                    {/* The Total Amount is just the Service Price. The fee is internal. */}
                    <span className="text-xl font-black text-navy">${Number(selectedService.price).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex space-x-4">
                {bookingToEdit && isOrgRole ? (
                  <>
                    {['pending','confirmed'].includes(status) && <button type="button" onClick={()=> handleStatusChange('cancelled')} className="flex-1 py-4 border border-red-200 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-all">Reject</button>}
                    {status==='pending' && <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg flex items-center justify-center space-x-2">{loading ? <SafeIcon icon={FiRefreshCw} className="animate-spin" /> : <SafeIcon icon={FiCheck} />}<span>Confirm</span></button>}
                    {status==='confirmed' && <button type="button" onClick={()=> handleStatusChange('completed')} className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 shadow-lg flex items-center justify-center space-x-2">{loading ? <SafeIcon icon={FiRefreshCw} className="animate-spin" /> : <SafeIcon icon={FiCheck} />}<span>Complete</span></button>}
                  </>
                ) : isReadOnly ? (
                  <button type="button" onClick={onClose} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all">Close</button>
                ) : (
                  <button type="submit" disabled={loading || (!bookingToEdit && !formData.scheduledTime)} className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2">
                    {loading ? <SafeIcon icon={FiRefreshCw} className="animate-spin" /> : <SafeIcon icon={FiSave} />}
                    <span>{bookingToEdit ? 'Save Changes' : 'Confirm'}</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            <AuditTrail bookingId={bookingToEdit.id} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ServiceBookingForm;