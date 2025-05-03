import React, { useState } from 'react';
import { ImageConfig } from '../../../types/pageComponents';
import { motion } from 'framer-motion';

interface ImageComponentProps {
  config: ImageConfig;
}

export const ImageComponent: React.FC<ImageComponentProps> = ({ config }) => {
  const {
    src,
    alt,
    caption,
    width,
    height,
    alignment,
    className,
    customStyles,
    animation
  } = config;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Alignment classes
  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto'
  };

  // Combine all classes
  const containerClasses = `
    mb-6
    ${className || ''}
  `;

  const imageClasses = `
    rounded-lg
    shadow-md
    ${alignmentClasses[alignment]}
    ${isLoading ? 'opacity-0' : 'opacity-100'}
    transition-opacity duration-300
  `;

  // Animation variants
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 }
    },
    slide: {
      initial: { y: 50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.5 }
    },
    zoom: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.5 }
    },
    none: {}
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Render image with optional caption
  const renderImage = () => (
    <div className={containerClasses} style={customStyles}>
      {isLoading && (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
      )}
      
      {hasError ? (
        <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-center">
          Failed to load image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={imageClasses}
          style={{ 
            width: width || 'auto', 
            height: height || 'auto',
            display: 'block' 
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {caption && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center italic">
          {caption}
        </p>
      )}
    </div>
  );

  // If no animation, just render the image
  if (!animation || animation === 'none') {
    return renderImage();
  }

  // With animation
  return (
    <motion.div
      initial={animationVariants[animation].initial}
      animate={animationVariants[animation].animate}
      transition={animationVariants[animation].transition}
    >
      {renderImage()}
    </motion.div>
  );
}; 