import React from 'react';
import {Link} from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
const {FiArrowRight}=FiIcons;
const BlogPage=()=> {const posts=[ {title: 'The Ultimate Guide to Choosing the Right Car Seat',
 category: 'Safety Guides',
 excerpt: 'Navigating the world of car seats can be overwhelming. This guide breaks down the types,features,and key considerations to help you make the best choice for your child.',
 author: 'Dr. Emily Carter',
 date: 'July 28,2024',
 image: 'https://images.unsplash.com/photo-1556912173-356c5a6a1e6d?fit=crop&w=600&h=400&q=80',
 },{title: 'Common Car Seat Installation Mistakes and How to Avoid Them',
 category: 'Installation Tips',
 excerpt: 'A certified CPST highlights the top 5 installation errors parents make and provides step-by-step instructions to ensure your child\'s seat is secure.',
 author: 'John Abe',
 date: 'July 22,2024',
 image: 'https://images.unsplash.com/photo-1604375484649-f4d642a8e2a3?fit=crop&w=600&h=400&q=80',
 },{title: 'When to Transition: Moving from Infant to Convertible Seat',
 category: 'Milestones',
 excerpt: 'Is your little one ready for the next step? We cover the height,weight,and developmental signs to look for when transitioning to a larger car seat.',
 author: 'Sarah Chen',
 date: 'July 15,2024',
 image: 'https://images.unsplash.com/photo-1599493356248-3ed9a656d053?fit=crop&w=600&h=400&q=80',
 },{title: 'Traveling with Kids: A Parent\'s Guide to Car Seat Rentals',
 category: 'Travel',
 excerpt: 'Learn the benefits of renting car seats for travel,what to look for in a rental service,and how to ensure safety on the go.',
 author: 'David Lee',
 date: 'July 10,2024',
 image: 'https://images.unsplash.com/photo-1502781252691-227b38a70505?fit=crop&w=600&h=400&q=80',
 },];return (
 <MainLayout>
 <>
 {/* Hero Section */}
 <div className="text-center py-20 px-4 bg-gray-50 border-b border-gray-200">
 <h1 className="text-4xl md:text-6xl font-bold text-navy tracking-tight">
 From the FitMySeat Blog
 </h1>
 <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
 Your trusted resource for child passenger safety tips,news,and updates.
 </p>
 </div>
 {/* Blog Grid */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
 {posts.map((post)=> (
 <div key={post.title} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
 <div className="flex-shrink-0">
 <img className="h-48 w-full object-cover" src={post.image} alt="" />
 </div>
 <div className="flex-1 bg-white p-6 flex flex-col justify-between">
 <div className="flex-1">
 <p className="text-sm font-medium text-teal-600">
 <Link to="#" className="hover:underline">
 {post.category}
 </Link>
 </p>
 <Link to="#" className="block mt-2">
 <p className="text-xl font-semibold text-gray-900">{post.title}</p>
 <p className="mt-3 text-base text-gray-500">{post.excerpt}</p>
 </Link>
 </div>
 <div className="mt-6 flex items-center">
 <div className="flex-shrink-0">
 <span className="sr-only">{post.author}</span>
 <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
 {post.author.charAt(0)}
 </div>
 </div>
 <div className="ml-3">
 <p className="text-sm font-medium text-gray-900">
 <Link to="#" className="hover:underline">
 {post.author}
 </Link>
 </p>
 <div className="flex space-x-1 text-sm text-gray-500">
 <time dateTime={post.date}>{post.date}</time>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </>
 </MainLayout>
 );};
export default BlogPage;