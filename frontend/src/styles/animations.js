/**
 * Animation Variants for Framer Motion
 * Consistent animations across the application
 */

// ===== PAGE TRANSITION VARIANTS =====
export const pageVariants = {
    initial: { 
        opacity: 0, 
        y: 20 
    },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        y: -20,
        transition: {
            duration: 0.3,
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
            staggerChildren: 0.1,
            delayChildren: 0.1,
        }
    },
};

// ===== ITEM VARIANTS (children of container) =====
export const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: 20 
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
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
            duration: 0.3,
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.2,
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
        scale: 0.9 
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: {
            duration: 0.2,
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
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
        }
    },
    hover: {
        y: -4,
        transition: {
            duration: 0.2,
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
            delay: i * 0.05,
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
        }
    }),
};

// ===== MODAL VARIANTS =====
export const modalVariants = {
    hidden: { 
        opacity: 0, 
        scale: 0.95,
        y: 20,
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.2,
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
            duration: 0.2,
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.2,
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
    fast: { staggerChildren: 0.05 },
    normal: { staggerChildren: 0.1 },
    slow: { staggerChildren: 0.15 },
};

// ===== SPRING PRESETS =====
export const springPresets = {
    default: { type: 'spring', stiffness: 300, damping: 25 },
    bouncy: { type: 'spring', stiffness: 500, damping: 20 },
    stiff: { type: 'spring', stiffness: 700, damping: 30 },
    gentle: { type: 'spring', stiffness: 200, damping: 20 },
};
