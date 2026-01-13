/**
     * Reliable default images for services based on their type.
     * Uses high-quality Unsplash images with specific IDs to ensure they load.
     */
    export const defaultServiceImages = {
      // Installation: Hands adjusting a car seat or a child safely buckled in
      installation: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
      
      // Inspection: A professional checking safety details
      inspection: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
      
      // Education: A parent carrying a child or a teaching setting
      education: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      
      // Workshop: A group setting or collaborative environment
      workshop: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=800&q=80',
      
      // Virtual Consultation: Laptop or video call setup
      virtual_consultation: 'https://images.unsplash.com/photo-1616587894289-86480e533129?auto=format&fit=crop&w=800&q=80',
      
      // Mobile Installation: A car on the road or travel context
      mobile_installation: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
      
      // Fallback generic image (Safety concept)
      default: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80'
    };

    /**
     * Helper to get the correct image URL for a service.
     * Handles missing types and ensures a string is always returned.
     * @param {object} service - The service object
     * @returns {string} The image URL
     */
    export const getServiceImage = (service) => {
      // 1. If service has its own image uploaded, use it.
      if (service?.image_url && service.image_url.trim() !== '') {
        return service.image_url;
      }

      // 2. Try to match the service type to a default image
      if (service?.service_type && defaultServiceImages[service.service_type]) {
        return defaultServiceImages[service.service_type];
      }

      // 3. Fallback to the generic default
      return defaultServiceImages.default;
    };