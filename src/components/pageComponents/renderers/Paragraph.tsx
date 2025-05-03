import React from 'react';
import { ParagraphConfig } from '../../../types/pageComponents';
import { motion } from 'framer-motion';

interface ParagraphProps {
  config: ParagraphConfig;
}

export const Paragraph: React.FC<ParagraphProps> = ({ config }) => {
  const {
    text,
    alignment,
    className,
    customStyles,
    animation
  } = config;

  // Text alignment
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  // Combine all classes
  const paragraphClasses = `
    text-base
    ${alignmentClasses[alignment]}
    text-gray-700 dark:text-gray-300
    mb-4
    leading-relaxed
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

  // Render the paragraph with line breaks if needed
  const paragraphContent = text.split('\\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\\n').length - 1 && <br />}
    </React.Fragment>
  ));

  // If no animation, just render the paragraph
  if (!animation || animation === 'none') {
    return (
      <p className={paragraphClasses} style={customStyles}>
        {paragraphContent}
      </p>
    );
  }

  // With animation
  return (
    <motion.p
      className={paragraphClasses}
      style={customStyles}
      initial={animationVariants[animation].initial}
      animate={animationVariants[animation].animate}
      transition={animationVariants[animation].transition}
    >
      {paragraphContent}
    </motion.p>
  );
}; 