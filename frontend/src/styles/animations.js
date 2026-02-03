/**
 * Animation Variants for Framer Motion
 * Consistent animations across the application
 */

// ===== MOBILE DETECTION UTILITY =====
const isMobile = () => window.innerWidth <= 600;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== RESPONSIVE DURATION HELPER =====
const getResponsiveDuration = (desktop, mobile = desktop * 0.5) => {
  if (prefersReducedMotion()) return 0.1;
  return isMobile() ? mobile : desktop;
};

// ===== PAGE TRANSITION VARIANTS =====
export const pageVariants = {
    initial: { 
        opacity: 0, 
        y: isMobile() ? 10 : 20 
    },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: getResponsiveDuration(0.6, 0.3),
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        y: isMobile() ? -10 : -20,
        transition: {
            duration: getResponsiveDuration(0.4, 0.2),
        }
    },
};

// ===== CONTAINER VARIANTS (for staggered children) =====
export const containerVariants = {
    hidden: { 
        opacity: 0 
    },
    visible: {
        opacity: 1,
        transition: { 
            staggerChildren: isMobile() ? 0.05 : 0.1,
            delayChildren: isMobile() ? 0.05 : 0.1,
        }
    },
};

// ===== ITEM VARIANTS (children of container) =====
export const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: isMobile() ? 10 : 20 
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: getResponsiveDuration(0.4, 0.2),
            ease: [0.16, 1, 0.3, 1],
        }
    },
};

// ===== FADE VARIANTS =====
export const fadeVariants = {
    hidden: { 
        opacity: 0 
    },
    visible: { 
        opacity: 1,
        transition: {
            duration: 0.5,
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.3,
        }
    },
};

// ===== SLIDE VARIANTS =====
export const slideVariants = {
    left: {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 },
    },
    right: {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 30 },
    },
    up: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 30 },
    },
    down: {
        initial: { opacity: 0, y: -30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
    },
};

// ===== SCALE VARIANTS =====
export const scaleVariants = {
    hidden: { 
        opacity: 0, 
        scale: isMobile() ? 0.95 : 0.9 
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
            duration: getResponsiveDuration(0.5, 0.25),
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: {
            duration: 0.3,
        }
    },
    tap: { 
        scale: 0.95 
    },
    hover: { 
        scale: 1.02 
    },
};

// ===== CARD VARIANTS =====
export const cardVariants = {
    hidden: { 
        opacity: 0, 
        y: 30, 
        scale: 0.95 
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
        }
    },
    hover: {
        y: -4,
        transition: {
            duration: 0.3,
        }
    },
    tap: {
        scale: 0.98,
    },
};

// ===== LIST ITEM VARIANTS =====
export const listItemVariants = {
    hidden: { 
        opacity: 0, 
        x: -20 
    },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.08,
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
        }
    }),
};

// ===== MODAL VARIANTS =====
export const modalVariants = {
    hidden: { 
        opacity: 0, 
        scale: isMobile() ? 0.98 : 0.95,
        y: isMobile() ? 10 : 20,
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        transition: {
            duration: getResponsiveDuration(0.5, 0.25),
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        scale: isMobile() ? 0.98 : 0.95,
        y: isMobile() ? 10 : 20,
        transition: {
            duration: getResponsiveDuration(0.3, 0.15),
        }
    },
};

// ===== BACKDROP VARIANTS =====
export const backdropVariants = {
    hidden: { 
        opacity: 0 
    },
    visible: { 
        opacity: 1,
        transition: {
            duration: 0.3,
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.3,
            delay: 0.1,
        }
    },
};

// ===== NOTIFICATION VARIANTS =====
export const notificationVariants = {
    initial: { 
        opacity: 0, 
        y: -50, 
        scale: 0.9 
    },
    animate: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        }
    },
    exit: { 
        opacity: 0, 
        y: -20, 
        scale: 0.9,
        transition: {
            duration: 0.2,
        }
    },
};

// ===== FLOATING ACTION BUTTON VARIANTS =====
export const fabVariants = {
    hidden: { 
        opacity: 0, 
        scale: 0, 
        rotate: -180 
    },
    visible: { 
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 20,
        }
    },
    hover: { 
        scale: 1.1,
        transition: {
            duration: 0.2,
        }
    },
    tap: { 
        scale: 0.9 
    },
};

// ===== STAGGER CONTAINER OPTIONS =====
export const staggerOptions = {
    fast: { staggerChildren: 0.08 },
    normal: { staggerChildren: 0.15 },
    slow: { staggerChildren: 0.2 },
};

// ===== SPRING PRESETS =====
export const springPresets = {
    default: { 
        type: 'spring', 
        stiffness: isMobile() ? 400 : 300, 
        damping: isMobile() ? 30 : 25 
    },
    bouncy: { 
        type: 'spring', 
        stiffness: isMobile() ? 600 : 500, 
        damping: isMobile() ? 25 : 20 
    },
    stiff: { 
        type: 'spring', 
        stiffness: isMobile() ? 800 : 700, 
        damping: isMobile() ? 35 : 30 
    },
    gentle: { 
        type: 'spring', 
        stiffness: isMobile() ? 250 : 200, 
        damping: isMobile() ? 25 : 20 
    },
};
