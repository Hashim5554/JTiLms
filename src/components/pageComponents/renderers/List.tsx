import React from 'react';
import { motion } from 'framer-motion';
import { ListConfig } from '../../../types/pageComponents';

const List: React.FC<ListConfig> = ({
  items,
  listType = 'unordered',
  className = '',
  customStyles = {},
  animation = 'fade'
}) => {
  const defaultStyles: React.CSSProperties = {
    margin: '1rem 0',
    paddingLeft: '2rem',
  };

  const combinedStyles = { ...defaultStyles, ...customStyles };

  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { x: -20, opacity: 0 },
      visible: { x: 0, opacity: 1 }
    },
    zoom: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1 }
    },
    none: {
      hidden: {},
      visible: {}
    }
  };

  const ListTag = listType === 'ordered' ? 'ol' : 'ul';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[animation]}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <ListTag className={className} style={combinedStyles}>
        {items.map((item, index) => (
          <motion.li 
            key={index}
            variants={variants[animation]}
            style={{ marginBottom: '0.5rem' }}
          >
            {item}
          </motion.li>
        ))}
      </ListTag>
    </motion.div>
  );
};

export default List; 