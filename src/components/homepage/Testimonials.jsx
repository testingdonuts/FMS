import React from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
const {FiStar}=FiIcons;
const Testimonials=()=> {const testimonials=[
 {name: "Jessica L.",
 image: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=100&h=100&fit=crop&crop=faces&q=80",
 content: "Booking a CPST through FitMySeat was a breeze. The technician was knowledgeable and so patient. I feel so much more confident about my baby's safety!",
 rating: 5,
 },{name: "David C.",
 image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces&q=80",
 content: "We rented a car seat for our vacation,and the process was seamless. The equipment was clean and in perfect condition. Highly recommend!",
 rating: 5,
 },{name: "Megan B.",
 image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80",
 content: "As a new dad,I had no idea what I was doing. The 'How It Works' guide was super helpful,and our technician was fantastic. Worth every penny.",
 rating: 5,
 },];return (
 <section className="py-20 bg-white">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center mb-16">
 <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">What Parents Say</h2>
 <p className="text-lg text-gray-600 max-w-2xl mx-auto"> Hear from families who trust FitMySeat for their child's safety. </p>
 </div>
 <div className="grid md:grid-cols-3 gap-8">
 {testimonials.map((testimonial,index)=> (
 <motion.div key={index} initial={{opacity: 0,scale: 0.9}} whileInView={{opacity: 1,scale: 1}} transition={{duration: 0.5,delay: index * 0.2}} viewport={{once: true}} className="bg-gray-50 p-8 rounded-2xl" >
 <div className="flex items-center mb-4">
 {[...Array(testimonial.rating)].map((_,i)=> (
 <SafeIcon key={i} icon={FiStar} className="text-soft-yellow fill-current" />
 ))}
 </div>
 <p className="text-gray-700 italic mb-6">"{testimonial.content}"</p>
 <div className="flex items-center">
 <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover mr-4" />
 <div>
 <h4 className="font-semibold text-navy">{testimonial.name}</h4>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );};
export default Testimonials;