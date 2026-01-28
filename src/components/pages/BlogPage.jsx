import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const { FiArrowRight, FiStar, FiCalendar, FiUser, FiBookOpen } = FiIcons;

// Fallback hardcoded posts when database is empty or unavailable
const fallbackPosts = [
  {
    title: 'The Ultimate Guide to Choosing the Right Car Seat',
    slug: 'ultimate-guide-choosing-right-car-seat',
    category: 'Safety Guides',
    excerpt: 'Navigating the world of car seats can be overwhelming. This guide breaks down the types, features, and key considerations to help you make the best choice for your child.',
    author_name: 'Dr. Emily Carter',
    published_at: '2024-07-28',
    featured_image: 'https://images.unsplash.com/photo-1556912173-356c5a6a1e6d?fit=crop&w=600&h=400&q=80',
    is_featured: true
  },
  {
    title: 'Common Car Seat Installation Mistakes and How to Avoid Them',
    slug: 'common-car-seat-installation-mistakes',
    category: 'Installation Tips',
    excerpt: "A certified CPST highlights the top 5 installation errors parents make and provides step-by-step instructions to ensure your child's seat is secure.",
    author_name: 'John Abe',
    published_at: '2024-07-22',
    featured_image: 'https://images.unsplash.com/photo-1604375484649-f4d642a8e2a3?fit=crop&w=600&h=400&q=80',
    is_featured: false
  },
  {
    title: 'When to Transition: Moving from Infant to Convertible Seat',
    slug: 'when-to-transition-infant-convertible',
    category: 'Milestones',
    excerpt: 'Is your little one ready for the next step? We cover the height, weight, and developmental signs to look for when transitioning to a larger car seat.',
    author_name: 'Sarah Chen',
    published_at: '2024-07-15',
    featured_image: 'https://images.unsplash.com/photo-1599493356248-3ed9a656d053?fit=crop&w=600&h=400&q=80',
    is_featured: false
  },
  {
    title: "Traveling with Kids: A Parent's Guide to Car Seat Rentals",
    slug: 'traveling-with-kids-car-seat-rentals',
    category: 'Travel',
    excerpt: 'Learn the benefits of renting car seats for travel, what to look for in a rental service, and how to ensure safety on the go.',
    author_name: 'David Lee',
    published_at: '2024-07-10',
    featured_image: 'https://images.unsplash.com/photo-1502781252691-227b38a70505?fit=crop&w=600&h=400&q=80',
    is_featured: false
  }
];

const categories = ['All', 'Safety Guides', 'Installation Tips', 'Milestones', 'Travel', 'News', 'Product Reviews'];

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [featuredPost, setFeaturedPost] = useState(null);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error || !data || data.length === 0) {
        // Use fallback posts
        setPosts(fallbackPosts);
        setFeaturedPost(fallbackPosts.find(p => p.is_featured) || fallbackPosts[0]);
      } else {
        setPosts(data);
        setFeaturedPost(data.find(p => p.is_featured) || data[0]);
      }
    } catch (err) {
      // Use fallback posts on error
      setPosts(fallbackPosts);
      setFeaturedPost(fallbackPosts.find(p => p.is_featured) || fallbackPosts[0]);
    }
    
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  const regularPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

  return (
    <MainLayout>
      <>
        {/* Hero Section */}
        <div className="text-center py-20 px-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-4xl md:text-6xl font-bold text-navy tracking-tight">
            From the FitMySeat Blog
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted resource for child passenger safety tips, news, and updates.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && selectedCategory === 'All' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link to={`/blog/${featuredPost.slug}`} className="block group">
                  <div className="relative rounded-3xl overflow-hidden bg-navy shadow-2xl">
                    <div className="absolute inset-0">
                      <img
                        src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1556912173-356c5a6a1e6d?fit=crop&w=1200&h=600&q=80'}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                      />
                    </div>
                    <div className="relative p-8 md:p-12 lg:p-16">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-teal-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                          <SafeIcon icon={FiStar} className="text-xs" /> Featured
                        </span>
                        <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                          {featuredPost.category}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 group-hover:text-teal-300 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-lg text-white/80 max-w-2xl mb-6">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-white/70">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                            {featuredPost.author_name?.charAt(0) || 'A'}
                          </div>
                          <span>{featuredPost.author_name}</span>
                        </div>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <SafeIcon icon={FiCalendar} className="text-sm" />
                          {formatDate(featuredPost.published_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Category Filter */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                      selectedCategory === category
                        ? 'bg-navy text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {regularPosts.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <SafeIcon icon={FiBookOpen} className="text-5xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No posts in this category yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularPosts.map((post) => (
                    <Link
                      key={post.id || post.slug}
                      to={`/blog/${post.slug}`}
                      className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow group"
                    >
                      <div className="flex-shrink-0 relative overflow-hidden">
                        <img
                          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={post.featured_image || 'https://images.unsplash.com/photo-1556912173-356c5a6a1e6d?fit=crop&w=600&h=400&q=80'}
                          alt={post.title}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-base text-gray-500 line-clamp-3">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
                              {post.author_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{post.author_name}</p>
                              <p className="text-xs text-gray-500">{formatDate(post.published_at)}</p>
                            </div>
                          </div>
                          <SafeIcon icon={FiArrowRight} className="text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </>
    </MainLayout>
  );
};

export default BlogPage;