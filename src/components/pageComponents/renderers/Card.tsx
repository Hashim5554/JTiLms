import React from 'react';
import { motion } from 'framer-motion';
import { CardConfig } from '../../../types/pageComponents';

const Card: React.FC<CardConfig> = ({
  title,
  content,
  image,
  className = '',
  customStyles = {},
  animation = 'fade'
}) => {
  const defaultStyles: React.CSSProperties = {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const combinedStyles = { ...defaultStyles, ...customStyles };

  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    },
    zoom: {
      hidden: { scale: 0.9, opacity: 0 },
      visible: { scale: 1, opacity: 1 }
    },
    none: {
      hidden: {},
      visible: {}
    }
  };

  return (
    <motion.div
      className={`card ${className}`}
      style={combinedStyles}
      initial="hidden"
      animate="visible"
      variants={variants[animation || 'fade']}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' 
      }}
    >
      {image && (
        <div 
          className="card-image" 
          style={{ 
            marginBottom: '1rem', 
            overflow: 'hidden', 
            borderRadius: '0.25rem' 
          }}
        >
          <img 
            src={image.src} 
            alt={image.alt || title || 'Card image'} 
            style={{ 
              width: image.width || '100%', 
              height: image.height || 'auto',
              objectFit: 'cover',
              display: 'block'
            }} 
          />
        </div>
      )}
      
      {title && (
        <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 600 }}>
          {title}
        </h3>
      )}
      
      <div className="card-content">
        {typeof content === 'string' ? <p>{content}</p> : content}
      </div>
    </motion.div>
  );
};

export default Card; 