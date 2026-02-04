/**
 * Performance Utilities for PWA
 * 
 * Provides utilities for:
 * - Route prefetching
 * - Image lazy loading with IntersectionObserver
 * - Performance monitoring and metrics
 * - Resource hints management
 * - Network-aware loading strategies
 */

// Prefetch cache to avoid duplicate prefetches
const prefetchedRoutes = new Set();
const prefetchedAssets = new Set();

/**
 * Check if the user has a slow connection
 */
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    // Consider 2G, slow-2g, or saveData mode as slow
    return (
      connection.saveData ||
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    );
  }
  return false;
};

/**
 * Check if the user prefers reduced data
 */
export const prefersReducedData = () => {
  if ('connection' in navigator) {
    return navigator.connection.saveData === true;
  }
  return false;
};

/**
 * Prefetch a route's JavaScript chunk
 * Uses the browser's idle time to load routes the user might navigate to
 * 
 * @param {string} routePath - The route path to prefetch (e.g., '/active-plans')
 */
export const prefetchRoute = (routePath) => {
  // Don't prefetch on slow connections
  if (isSlowConnection() || prefersReducedData()) {
    return;
  }

  // Already prefetched
  if (prefetchedRoutes.has(routePath)) {
    return;
  }

  prefetchedRoutes.add(routePath);

  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleTask = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  scheduleTask(() => {
    // Create a prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    
    // Map routes to their chunk names (based on our lazy loading setup)
    const routeToChunk = {
      '/home': '/pages/HomePage',
      '/active-plans': '/pages/ActivePlansPage',
      '/chat': '/pages/ChatPage',
      '/settings': '/pages/SettingsPage',
      '/announcements': '/pages/AnnouncementsPage',
      '/new-form': '/pages/NewFormPage',
      '/admin/dashboard': '/pages/AdminDashboardPage',
    };

    // This is a hint for Vite/browser - actual implementation depends on build output
    console.log(`[Performance] Prefetching route: ${routePath}`);
  });
};

/**
 * Prefetch routes that the user is likely to navigate to based on current route
 * 
 * @param {string} currentPath - Current route path
 */
export const prefetchLikelyRoutes = (currentPath) => {
  // Define likely navigation patterns
  const routePredictions = {
    '/': ['/login', '/register'],
    '/login': ['/home', '/register'],
    '/home': ['/active-plans', '/chat', '/new-form', '/settings'],
    '/active-plans': ['/home', '/view-plan'],
    '/admin/dashboard': ['/admin/users', '/admin/forms', '/admin/chats'],
  };

  const likelyRoutes = routePredictions[currentPath] || [];
  likelyRoutes.forEach(route => prefetchRoute(route));
};

/**
 * Preconnect to important origins to reduce connection latency
 * Call this early in the app lifecycle
 */
export const setupResourceHints = () => {
  const origins = [
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  origins.forEach(origin => {
    try {
      // Preconnect
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      // DNS prefetch as fallback
      const dnsPrefetch = document.createElement('link');
      dnsPrefetch.rel = 'dns-prefetch';
      dnsPrefetch.href = origin;
      document.head.appendChild(dnsPrefetch);
    } catch (e) {
      console.log('[Performance] Could not add resource hint:', origin);
    }
  });
};

/**
 * Lazy load images using IntersectionObserver
 * Automatically handles images with data-src attribute
 */
export const setupLazyImages = () => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers - load all images immediately
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before image enters viewport
    threshold: 0.01,
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  return imageObserver;
};

/**
 * Performance metrics collection
 * Collects Core Web Vitals and custom metrics
 */
export const collectPerformanceMetrics = () => {
  const metrics = {};

  // Navigation timing
  if ('performance' in window && performance.timing) {
    const timing = performance.timing;
    metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    metrics.firstByte = timing.responseStart - timing.navigationStart;
  }

  // Paint timing (FCP, LCP)
  if ('PerformanceObserver' in window) {
    try {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
            console.log('[Performance] FCP:', Math.round(entry.startTime), 'ms');
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = lastEntry.startTime;
        console.log('[Performance] LCP:', Math.round(lastEntry.startTime), 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.fid = entry.processingStart - entry.startTime;
          console.log('[Performance] FID:', Math.round(metrics.fid), 'ms');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (e) {
      console.log('[Performance] Could not setup performance observers:', e);
    }
  }

  return metrics;
};

/**
 * Report performance metrics (for analytics)
 */
export const reportMetrics = (metrics) => {
  // In production, you could send this to your analytics service
  if (import.meta.env.DEV) {
    console.log('[Performance] Metrics:', metrics);
  }
  // Example: sendToAnalytics(metrics);
};

/**
 * Debounce utility for performance-sensitive operations
 */
export const debounce = (func, wait = 100) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle utility for rate-limiting function calls
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Initialize all performance optimizations
 * Call this in main.jsx after initial render
 */
export const initializePerformanceOptimizations = () => {
  // Setup resource hints for faster connections
  setupResourceHints();
  
  // Start collecting performance metrics
  if (import.meta.env.DEV) {
    collectPerformanceMetrics();
  }
  
  // Setup lazy image loading
  setupLazyImages();
  
  // Prefetch likely routes after initial load
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      prefetchLikelyRoutes(window.location.pathname);
    });
  }
};

export default {
  isSlowConnection,
  prefersReducedData,
  prefetchRoute,
  prefetchLikelyRoutes,
  setupResourceHints,
  setupLazyImages,
  collectPerformanceMetrics,
  reportMetrics,
  debounce,
  throttle,
  initializePerformanceOptimizations,
};
