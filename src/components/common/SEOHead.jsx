import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Head Component
 * Updates document title and meta tags dynamically for each page
 * 
 * Usage:
 * <SEOHead 
 *   title="Page Title" 
 *   description="Page description for SEO"
 *   keywords="comma, separated, keywords"
 *   image="/path/to/image.jpg"
 *   type="article"
 * />
 */

const SEOHead = ({ 
  title, 
  description, 
  keywords,
  image,
  type = 'website',
  noindex = false,
  canonicalUrl,
  author,
  publishedTime,
  modifiedTime,
  section
}) => {
  const location = useLocation();
  const baseUrl = 'https://fitmyseat.com.au';
  const defaultTitle = 'FitMySeat | Find Certified Child Car Seat Technicians Near You';
  const defaultDescription = "Australia's trusted platform for child car seat safety. Find certified CPSTs, book professional installations, and ensure your child's safety.";
  const defaultImage = `${baseUrl}/og-image.jpg`;

  const fullTitle = title ? `${title} | FitMySeat` : defaultTitle;
  const fullUrl = canonicalUrl || `${baseUrl}${location.pathname}`;
  const fullImage = image?.startsWith('http') ? image : `${baseUrl}${image || '/og-image.jpg'}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const updateMeta = (property, content, isProperty = false) => {
      if (!content) return;
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Update standard meta tags
    updateMeta('description', description || defaultDescription);
    if (keywords) updateMeta('keywords', keywords);
    if (author) updateMeta('author', author);
    updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Update Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description || defaultDescription, true);
    updateMeta('og:url', fullUrl, true);
    updateMeta('og:image', fullImage, true);
    updateMeta('og:type', type, true);
    
    if (type === 'article') {
      if (publishedTime) updateMeta('article:published_time', publishedTime, true);
      if (modifiedTime) updateMeta('article:modified_time', modifiedTime, true);
      if (section) updateMeta('article:section', section, true);
      if (author) updateMeta('article:author', author, true);
    }

    // Update Twitter tags
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description || defaultDescription);
    updateMeta('twitter:image', fullImage);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', fullUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', fullUrl);
      document.head.appendChild(canonical);
    }

  }, [fullTitle, description, keywords, fullUrl, fullImage, type, noindex, author, publishedTime, modifiedTime, section]);

  return null; // This component doesn't render anything
};

export default SEOHead;

/**
 * Page titles configuration for common pages
 */
export const pageTitles = {
  home: { title: null, description: "Australia's trusted platform for child car seat safety. Find certified CPSTs, book installations, and rent equipment." },
  about: { title: 'About Us', description: 'Learn about FitMySeat and our mission to make child car seat safety accessible to every family in Australia.' },
  services: { title: 'Our Services', description: 'Professional car seat installation, inspection, and rental services from certified child passenger safety technicians.' },
  search: { title: 'Find Technicians', description: 'Search for certified child car seat technicians near you. Book installations, inspections, and rentals.' },
  blog: { title: 'Safety Blog', description: 'Expert tips, guides, and news about child car seat safety from certified professionals.' },
  contact: { title: 'Contact Us', description: 'Get in touch with FitMySeat. We are here to help with your child car seat safety questions.' },
  faq: { title: 'FAQ', description: 'Frequently asked questions about car seat safety, installations, and our services.' },
  login: { title: 'Log In', description: 'Log in to your FitMySeat account to manage bookings and access your dashboard.' },
  signup: { title: 'Sign Up', description: 'Create your FitMySeat account to book car seat services or register as a certified technician.' },
  privacy: { title: 'Privacy Policy', description: 'FitMySeat privacy policy. Learn how we collect, use, and protect your personal information.' },
  terms: { title: 'Terms of Service', description: 'FitMySeat terms of service. Read our terms and conditions for using the platform.' },
  cookies: { title: 'Cookie Policy', description: 'FitMySeat cookie policy. Learn about the cookies we use and how to manage them.' },
  howItWorks: { title: 'How It Works', description: 'Learn how FitMySeat connects you with certified car seat technicians in 3 easy steps.' },
};
