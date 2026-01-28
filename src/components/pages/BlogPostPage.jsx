import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const { FiArrowLeft, FiCalendar, FiUser, FiEye, FiClock, FiShare2, FiBookOpen } = FiIcons;

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    if (slug) {
      loadBlogPost();
    }
  }, [slug]);

  const loadBlogPost = async () => {
    setLoading(true);
    
    // Fetch the post
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (error || !data) {
      setLoading(false);
      return;
    }
    
    setPost(data);
    
    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);
    
    // Fetch related posts from same category
    const { data: related } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, author_name, published_at')
      .eq('is_published', true)
      .eq('category', data.category)
      .neq('id', data.id)
      .order('published_at', { ascending: false })
      .limit(3);
    
    setRelatedPosts(related || []);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const estimateReadTime = (content) => {
    const wordsPerMinute = 200;
    const words = content?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Simple markdown-like rendering for content
  const renderContent = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;
    
    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-6 text-gray-600">
              {currentList.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-2 mb-6 text-gray-600">
              {currentList.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          );
        }
        currentList = [];
        listType = null;
      }
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-xl font-bold text-navy mt-8 mb-4">
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-navy mt-10 mb-4">
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-3xl font-bold text-navy mt-10 mb-6">
            {trimmedLine.replace('# ', '')}
          </h1>
        );
      }
      // Unordered list items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(formatInlineText(trimmedLine.substring(2)));
      }
      // Ordered list items
      else if (/^\d+\.\s/.test(trimmedLine)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(formatInlineText(trimmedLine.replace(/^\d+\.\s/, '')));
      }
      // Empty line
      else if (trimmedLine === '') {
        flushList();
      }
      // Regular paragraph
      else {
        flushList();
        elements.push(
          <p key={index} className="text-gray-600 leading-relaxed mb-4">
            {formatInlineText(trimmedLine)}
          </p>
        );
      }
    });
    
    flushList();
    return elements;
  };

  // Format inline text (bold, italic, links)
  const formatInlineText = (text) => {
    // Replace **text** with bold
    const parts = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) parts.push(beforeBold);
        parts.push(<strong key={key++} className="font-semibold text-gray-800">{boldMatch[1]}</strong>);
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    
    return parts;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <SafeIcon icon={FiBookOpen} className="text-6xl text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h1>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} /> Back to Blog
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative">
          {post.featured_image ? (
            <div className="h-[400px] md:h-[500px] relative">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
          ) : (
            <div className="h-[300px] bg-gradient-to-br from-teal-600 to-blue-700"></div>
          )}
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <Link 
                to="/blog" 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} /> Back to Blog
              </Link>
              
              <span className="inline-block px-3 py-1 bg-teal-500 text-white text-sm font-medium rounded-full mb-4">
                {post.category}
              </span>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                    {post.author_name?.charAt(0) || 'A'}
                  </div>
                  <span className="font-medium text-white">{post.author_name}</span>
                </div>
                <span className="flex items-center gap-1">
                  <SafeIcon icon={FiCalendar} />
                  {formatDate(post.published_at || post.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <SafeIcon icon={FiClock} />
                  {estimateReadTime(post.content)}
                </span>
                <span className="flex items-center gap-1">
                  <SafeIcon icon={FiEye} />
                  {post.view_count || 0} views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          {/* Share button */}
          <div className="flex justify-end mb-8">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiShare2} /> Share
            </button>
          </div>

          {/* Excerpt/Lead */}
          {post.excerpt && (
            <p className="text-xl text-gray-700 leading-relaxed mb-8 font-medium border-l-4 border-teal-500 pl-6">
              {post.excerpt}
            </p>
          )}

          {/* Main content */}
          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags/Category footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-sm text-gray-500">Category:</span>
                <Link 
                  to={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {post.category}
                </Link>
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                <SafeIcon icon={FiShare2} /> Share this article
              </button>
            </div>
          </div>

          {/* Author bio */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-600 text-xl flex-shrink-0">
              {post.author_name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-sm text-gray-500">Written by</p>
              <h3 className="font-bold text-gray-900 text-lg">{post.author_name}</h3>
              <p className="text-gray-600 text-sm mt-1">
                Contributing writer at FitMySeat, dedicated to keeping families safe on the road.
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <Link 
                    key={related.id} 
                    to={`/blog/${related.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                  >
                    {related.featured_image ? (
                      <img 
                        src={related.featured_image} 
                        alt={related.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{related.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{related.excerpt}</p>
                      <p className="text-xs text-gray-400 mt-3">
                        {formatDate(related.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Back to blog CTA */}
        <div className="py-12 text-center">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} /> View All Articles
          </Link>
        </div>
      </article>
    </MainLayout>
  );
};

export default BlogPostPage;
