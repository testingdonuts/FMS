export const faqCategories = [
  { id: 'bookings', name: 'Booking & Appointments', icon: 'FiCalendar' },
  { id: 'payments', name: 'Payments & Billing', icon: 'FiCreditCard' },
  { id: 'roles', name: 'Account & Roles', icon: 'FiUsers' },
  { id: 'safety', name: 'Child Safety & Equipment', icon: 'FiShield' },
  { id: 'emergency', name: 'Emergency Guidance', icon: 'FiAlertTriangle' }
];

export const faqs = [
  {
    id: 1,
    category: 'bookings',
    question: "How do I book a car seat installation?",
    answer: "To book a service, navigate to the 'Services' page, select the desired installation type, and click 'Book Now'. You will be prompted to choose an available date and time slot from the organization's calendar.",
    role: 'parent'
  },
  {
    id: 2,
    category: 'bookings',
    question: "Can I reschedule my appointment?",
    answer: "Yes, you can reschedule your appointment up to 24 hours before the scheduled time. Go to your Dashboard, find the booking, and click 'Edit Details' or 'Reschedule'.",
    role: 'parent'
  },
  {
    id: 3,
    category: 'payments',
    question: "When is payment due?",
    answer: "Payment is typically due upon completion of the service. However, some organizations may require a deposit upfront. You can pay securely through the platform using a credit card.",
    role: 'parent'
  },
  {
    id: 4,
    category: 'safety',
    question: "What is the pinch test?",
    answer: "The pinch test is used to ensure the harness is tight enough. After buckling your child, try to pinch the webbing at the shoulder. If you can pinch any slack, the harness is too loose.",
    role: 'all'
  },
  {
    id: 5,
    category: 'safety',
    question: "How long should my child rear-face?",
    answer: "The AAP and NHTSA recommend keeping children rear-facing as long as possible, until they reach the maximum height or weight limit allowed by their car seat manufacturer.",
    role: 'all'
  },
  {
    id: 6,
    category: 'roles',
    question: "How do I join an organization as a technician?",
    answer: "To join an organization, you need an invitation code from the organization owner. Once you have the code, use the 'Join Team' link in your invitation email or go to the signup page and select 'Team Member'.",
    role: 'technician'
  }
];