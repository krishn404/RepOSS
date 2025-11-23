import { Variants } from "framer-motion"

// Fade in animations
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
}

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
}

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
}

// Scale animations
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
}

export const scaleInSpring: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
}

// Stagger container
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

export const staggerContainerFast: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
}

export const staggerContainerSlow: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.3
        }
    }
}

// Stagger items
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
}

// Text reveal animations
export const textReveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    })
}

export const letterReveal: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.03,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    })
}

// Slide animations
export const slideInFromBottom: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
}

export const slideInFromTop: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
}

// Rotate animations
export const rotateIn: Variants = {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: {
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
}

// Blur animations
export const blurIn: Variants = {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: "easeOut" }
    }
}

// Viewport scroll animations
export const scrollFadeIn = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

export const scrollScale = {
    initial: { opacity: 0, scale: 0.8 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

export const scrollSlideLeft = {
    initial: { opacity: 0, x: -60 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
}

export const scrollSlideRight = {
    initial: { opacity: 0, x: 60 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
}

// Hover animations
export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" }
}

export const hoverLift = {
    y: -8,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}

// Button animations
export const buttonTap = {
    scale: 0.95,
    transition: { duration: 0.1 }
}

// Card animations
export const cardHover = {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}

// Gradient blob animations
export const floatingBlob: Variants = {
    initial: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 0.5
    },
    animate: {
        x: [0, 30, -20, 0],
        y: [0, -30, 20, 0],
        scale: [1, 1.05, 0.95, 1],
        opacity: [0.5, 0.6, 0.4, 0.5],
        transition: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}
