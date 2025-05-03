import React from 'react';
import { HeadingConfig } from '../../../types/pageComponents';
import { motion } from 'framer-motion';

interface HeadingProps {
  config: HeadingConfig;
}

export const Heading: React.FC<HeadingProps> = ({ config }) => {
  const {
    text,
    level,
    alignment,
    className,
    customStyles,
    animation
  } = config;

  // Base styles for each heading level
  const baseStyles = {
    1: 'text-4xl sm:text-5xl font-bold',
    2: 'text-3xl sm:text-4xl font-bold',
    3: 'text-2xl sm:text-3xl font-semibold',
    4: 'text-xl sm:text-2xl font-semibold',
    5: 'text-lg sm:text-xl font-medium',
    6: 'text-base sm:text-lg font-medium',
  };

  // Text alignment
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Combine all classes
  const headingClasses = `
    ${baseStyles[level]} 
    ${alignmentClasses[alignment]}
    text-gray-900 dark:text-white
    mb-4
    ${className || ''}
  `;

  // Animation variants
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 }
    },
    slide: {
      initial: { x: -50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { duration: 0.5 }
    },
    zoom: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.5 }
    },
    none: {}
  };

  // Render the appropriate heading level
  const renderHeading = () => {
    const headingProps = {
      className: headingClasses,
      style: customStyles
    };

    switch (level) {
      case 1:
        return <h1 {...headingProps}>{text}</h1>;
      case 2:
        return <h2 {...headingProps}>{text}</h2>;
      case 3:
        return <h3 {...headingProps}>{text}</h3>;
      case 4:
        return <h4 {...headingProps}>{text}</h4>;
      case 5:
        return <h5 {...headingProps}>{text}</h5>;
      case 6:
        return <h6 {...headingProps}>{text}</h6>;
      default:
        return <h2 {...headingProps}>{text}</h2>;
    }
  };

  // If no animation, just render the heading
  if (!animation || animation === 'none') {
    return renderHeading();
  }

  // With animation
  return (
    <motion.div
      initial={animationVariants[animation].initial}
      animate={animationVariants[animation].animate}
      transition={animationVariants[animation].transition}
    >
      {renderHeading()}
    </motion.div>
  );
}; 