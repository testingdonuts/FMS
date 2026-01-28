/**
 * Performance Utilities for FitMySeat
 * Provides helper functions and hooks for optimizing performance
 */

import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';

/**
 * Lazy load a component with a loading fallback
 * @param {function} importFn - Dynamic import function
 * @param {React.Component} fallback - Loading fallback component
 * @returns {React.Component} - Lazy loaded component wrapped in Suspense
 */
export const lazyLoad = (importFn, fallback = null) => {
  const LazyComponent = lazy(importFn);
  
  return (props) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Simple loading spinner component
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`${sizes[size]} border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin`} />
    </div>
  );
};

/**
 * Full page loading component
 */
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

/**
 * Hook for debouncing values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls
 * @param {function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {function} - Throttled function
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 * @param {object} options - IntersectionObserver options
 * @returns {array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.root]);

  return [ref, isIntersecting, entry];
};

/**
 * Lazy loaded image component with placeholder
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isIntersecting) {
      setShouldLoad(true);
    }
  }, [isIntersecting]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for detecting if component is mounted
 * Prevents state updates on unmounted components
 */
export const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

/**
 * Hook for previous value
 * @param {any} value - Current value
 * @returns {any} - Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Preload critical images
 * @param {string[]} urls - Array of image URLs to preload
 */
export const preloadImages = (urls) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * Preload critical resources using link preload
 * @param {string} href - Resource URL
 * @param {string} as - Resource type (script, style, image, font)
 */
export const preloadResource = (href, as) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
};

/**
 * Memory-efficient infinite scroll hook
 */
export const useInfiniteScroll = (loadMore, hasMore, isLoading) => {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0 });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  return ref;
};

export default {
  lazyLoad,
  LoadingSpinner,
  PageLoader,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  LazyImage,
  useIsMounted,
  usePrevious,
  preloadImages,
  preloadResource,
  useInfiniteScroll
};
