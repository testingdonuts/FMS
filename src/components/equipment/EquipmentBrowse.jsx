import React,{useState,useEffect} from 'react';
    import {motion,AnimatePresence} from 'framer-motion';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    import {equipmentService} from '../../services/equipmentService';
    import EquipmentCard from './EquipmentCard';
    import EquipmentRentalModal from './EquipmentRentalModal';
    import {useAuth} from '../../hooks/useAuth';
    import {useBooking} from '../../context/BookingContext';
    const {FiSearch,FiFilter,FiPackage,FiDollarSign}=FiIcons;
    const EquipmentBrowse=()=> {
    const [equipment,setEquipment]=useState([]);
    const [filteredEquipment,setFilteredEquipment]=useState([]);
    const [loading,setLoading]=useState(false);
    const [filters,setFilters]=useState({search: '',category: '',maxPrice: '',sortBy: 'name'});
    const [showRentalModal,setShowRentalModal]=useState(false);
    const [selectedEquipment,setSelectedEquipment]=useState(null);
    const {user}=useAuth();
    const {bookingIntent,setBookingIntent,openAuthModal}=useBooking();
    const categories=[ 'Sports Equipment','Training Accessories','Safety Gear','Audio/Visual Equipment','Furniture','Technology','Other' ];
    const sortOptions=[ {value: 'name',label: 'Name A-Z'},{value: 'price_low',label: 'Price: Low to High'},{value: 'price_high',label: 'Price: High to Low'},{value: 'category',label: 'Category'},{value: 'newest',label: 'Newest First'} ];
    useEffect(()=> {
    loadEquipment();
    },[]);
    useEffect(()=> {
    filterAndSortEquipment();
    },[equipment,filters]);
    useEffect(()=> {
    if (user && bookingIntent?.type==='equipment') {
    setSelectedEquipment(bookingIntent.item);
    setShowRentalModal(true);
    setBookingIntent(null);
    }
    },[user,bookingIntent,setBookingIntent]);
    const loadEquipment=async ()=> {
    setLoading(true);
    const {data,error}=await equipmentService.getAvailableEquipment();
    if (data) {
    setEquipment(data);
    } else if (error) {
    console.error('Error loading equipment:',error);
    }
    setLoading(false);
    };
    const filterAndSortEquipment=()=> {
    let filtered=[...equipment];
    // Apply filters
    if (filters.search) {
    const searchTerm=filters.search.toLowerCase();
    filtered=filtered.filter(item=> item.name.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm) );
    }
    if (filters.category) {
    filtered=filtered.filter(item=> item.category===filters.category);
    }
    if (filters.maxPrice) {
    filtered=filtered.filter(item=> item.rental_price_per_day <=parseFloat(filters.maxPrice));
    }
    // Apply sorting
    filtered.sort((a,b)=> {
    switch (filters.sortBy) {
    case 'name':
    return a.name.localeCompare(b.name);
    case 'price_low':
    return a.rental_price_per_day - b.rental_price_per_day;
    case 'price_high':
    return b.rental_price_per_day - a.rental_price_per_day;
    case 'category':
    return a.category.localeCompare(b.category);
    case 'newest':
    return new Date(b.created_at) - new Date(a.created_at);
    default:
    return 0;
    }
    });
    setFilteredEquipment(filtered);
    };
    const handleFilterChange=(field,value)=> {
    setFilters(prev=> ({...prev,[field]: value}));
    };
    const handleBookEquipment=(equipmentItem)=> {
    if (user) {
    setSelectedEquipment(equipmentItem);
    setShowRentalModal(true);
    } else {
    setBookingIntent({type: 'equipment',item: equipmentItem});
    openAuthModal();
    }
    };
    const handleRentalComplete=(rental)=> {
    console.log('Rental completed:',rental);
    // Optionally reload equipment to update availability
    loadEquipment();
    };
    return (
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
     <div className="space-y-6">
     {/* Header */}
     <div className="text-center">
     <h1 className="text-3xl font-bold text-gray-900 mb-4"> Browse Equipment Rentals </h1>
     <p className="text-lg text-gray-600"> Find and rent the perfect equipment for your needs </p>
     </div>
     {/* Filters */}
     <div className="bg-white rounded-lg border border-gray-200 p-6">
     <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
     {/* Search */}
     <div className="lg:col-span-2">
     <div className="relative">
     <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
     <input type="text" placeholder="Search equipment..." value={filters.search} onChange={(e)=> handleFilterChange('search',e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
     </div>
     </div>
     {/* Category */}
     <div>
     <select value={filters.category} onChange={(e)=> handleFilterChange('category',e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" >
     <option value="">All Categories</option>
     {categories.map(category=> (
     <option key={category} value={category}>
     {category}
     </option>
     ))}
     </select>
     </div>
     {/* Max Price */}
     <div>
     <div className="relative">
     <SafeIcon icon={FiDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
     <input type="number" placeholder="Max price/day" value={filters.maxPrice} onChange={(e)=> handleFilterChange('maxPrice',e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
     </div>
     </div>
     {/* Sort */}
     <div>
     <select value={filters.sortBy} onChange={(e)=> handleFilterChange('sortBy',e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" >
     {sortOptions.map(option=> (
     <option key={option.value} value={option.value}>
     {option.label}
     </option>
     ))}
     </select>
     </div>
     </div>
     {/* Results Summary */}
     <div className="mt-4 text-sm text-gray-600">
     Showing {filteredEquipment.length} of {equipment.length} items
     </div>
     </div>
     {/* Equipment Grid */}
     {loading ? (
     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
     {[...Array(6)].map((_,index)=> (
     <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
     <div className="h-48 bg-gray-200"></div>
     <div className="p-6">
     <div className="h-6 bg-gray-200 rounded mb-2"></div>
     <div className="h-4 bg-gray-200 rounded mb-4"></div>
     <div className="h-8 bg-gray-200 rounded"></div>
     </div>
     </div>
     ))}
     </div>
     ) : filteredEquipment.length > 0 ? (
     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
     {filteredEquipment.map((item)=> (
     <EquipmentCard key={item.id} equipment={item} onBook={handleBookEquipment} userRole="customer" showActions={true} />
     ))}
     </div>
     ) : (
     <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
     <SafeIcon icon={FiPackage} className="text-6xl text-gray-300 mx-auto mb-4" />
     <h3 className="text-xl font-semibold text-gray-600 mb-2"> No equipment found </h3>
     <p className="text-gray-500 mb-6"> Try adjusting your search or filter criteria </p>
     </div>
     )}
     {/* Rental Modal */}
     <EquipmentRentalModal isOpen={showRentalModal} onClose={()=> setShowRentalModal(false)} equipment={selectedEquipment} onRentalComplete={handleRentalComplete} userId={user?.id} />
     </div>
     </div>
     );
    };
    export default EquipmentBrowse;