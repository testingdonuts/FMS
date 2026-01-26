import React,{useState} from 'react';
import {format,startOfMonth,endOfMonth,startOfWeek,endOfWeek,eachDayOfInterval,isSameMonth,isSameDay,addMonths,subMonths,isToday, addWeeks, subWeeks} from 'date-fns';
import {motion,AnimatePresence} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {FiChevronLeft,FiChevronRight,FiCalendar,FiClock,FiUser,FiMapPin, FiGrid, FiList}=FiIcons;

const CalendarView=({bookings=[],onBookingClick})=> {
  const [currentDate,setCurrentDate]=useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month' | 'week'
  const [selectedDate,setSelectedDate]=useState(new Date());

  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  // Month Logic
  const monthStart=startOfMonth(currentDate);
  const monthEnd=endOfMonth(monthStart);
  
  // Week Logic
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const calendarDays = viewType === 'month' 
    ? eachDayOfInterval({start: startOfWeek(monthStart), end: endOfWeek(monthEnd)})
    : eachDayOfInterval({start: weekStart, end: weekEnd});

  const next = () => setCurrentDate(viewType === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prev = () => setCurrentDate(viewType === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));

  const getBookingsForDay=(day)=> {
    return bookings.filter(b=> isSameDay(new Date(b.booking_date),day));
  };

  const selectedDayBookings=getBookingsForDay(selectedDate);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 p-6 border-r border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy">
                {format(currentDate, viewType === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
               <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button 
                  onClick={() => setViewType('month')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'month' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500'}`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setViewType('week')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'week' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500'}`}
                >
                  Week
                </button>
              </div>

              <div className="flex space-x-1">
                <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <SafeIcon icon={FiChevronLeft} />
                </button>
                <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <SafeIcon icon={FiChevronRight} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {days.map(day=> (
              <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {calendarDays.map((day,idx)=> {
              const dayBookings=getBookingsForDay(day);
              const isSelected=isSameDay(day,selectedDate);
              const isCurrentMonth=isSameMonth(day,monthStart);
              
              return (
                <div key={idx} 
                  onClick={()=> setSelectedDate(day)} 
                  className={`min-h-[120px] p-2 cursor-pointer transition-all ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${isSelected ? 'ring-2 ring-teal-500 z-10' : 'hover:bg-teal-50/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-teal-600 text-white' : isSelected ? 'text-teal-600' : 'text-gray-700'} ${!isCurrentMonth && 'opacity-30'}`}>
                      {format(day,'d')}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayBookings.slice(0,3).map((b,i)=> (
                      <div key={i} className="text-[9px] leading-tight truncate bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 font-medium">
                        {format(new Date(b.booking_date),'h:mm a')}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[9px] text-gray-400 text-center font-medium">
                        + {dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Details Sidebar */}
        <div className="p-6 bg-gray-50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-navy mb-1">
              {format(selectedDate,'EEEE')}
            </h3>
            <p className="text-sm text-gray-500">
              {format(selectedDate,'MMMM d, yyyy')}
            </p>
          </div>
          <div className="space-y-4">
            {selectedDayBookings.length > 0 ? (
              selectedDayBookings.sort((a,b)=> new Date(a.booking_date) - new Date(b.booking_date)).map((booking)=> (
                <motion.div key={booking.id} initial={{opacity: 0,x: 20}} animate={{opacity: 1,x: 0}} onClick={()=> onBookingClick(booking)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-teal-500 cursor-pointer transition-all group" >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-600 flex items-center">
                      <SafeIcon icon={FiClock} className="mr-1" /> {format(new Date(booking.booking_date),'h:mm a')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${booking.status==='completed' ? 'bg-green-100 text-green-700' : booking.status==='confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-navy text-sm group-hover:text-teal-600 transition-colors">
                    {booking.service?.name}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 flex items-center">
                      <SafeIcon icon={FiUser} className="mr-1.5" /> {booking.parent_first_name} {booking.parent_last_name}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                  <SafeIcon icon={FiCalendar} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No bookings scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CalendarView;