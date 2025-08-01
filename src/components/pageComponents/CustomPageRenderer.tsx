import React from 'react';
import { CustomCard, CustomCardProps } from './CustomCard';
import { CustomBlock } from './CustomBlock';
import { CustomColumn } from './CustomColumn';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export interface CustomPageRendererProps {
  layout: string;
  blocks: CustomCardProps[];
  onUploadDoc?: (blockIdx: number, file: File) => void;
  editable?: boolean;
  onEditCard?: (blockIdx: number) => void;
  onDeleteCard?: (blockIdx: number) => void;
  onDeleteDoc?: (blockIdx: number, docIdx: number) => void;
}

export const CustomPageRenderer: React.FC<CustomPageRendererProps> = ({ 
  layout, 
  blocks, 
  onUploadDoc, 
  editable, 
  onEditCard,
  onDeleteCard,
  onDeleteDoc 
}) => {
  // Layout logic
  let layoutClass = '';
  switch (layout) {
    case 'grid':
      layoutClass = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      break;
    case 'columns-2':
      layoutClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
      break;
    case 'columns-3':
      layoutClass = 'grid grid-cols-1 md:grid-cols-3 gap-6';
      break;
    case 'list':
      layoutClass = 'flex flex-col gap-4';
      break;
    case 'left-sidebar':
      layoutClass = 'grid grid-cols-1 md:grid-cols-4 gap-6';
      break;
    case 'right-sidebar':
      layoutClass = 'grid grid-cols-1 md:grid-cols-4 gap-6';
      break;
    case 'hero':
      layoutClass = 'flex flex-col gap-6';
      break;
    case 'masonry':
      layoutClass = 'columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]';
      break;
    default:
      layoutClass = 'flex flex-col gap-6';
  }

  // Helper function to get component type based on layout and position
  const getComponentType = (layout: string, index: number, blockType?: string) => {
    // If block has a specific type, use it
    if (blockType) {
      return blockType;
    }
    
    // Fall back to layout-based logic
    switch (layout) {
      case 'hero':
        return index === 0 ? 'block' : 'card';
      case 'columns-2':
      case 'columns-3':
        return 'column';
      case 'left-sidebar':
      case 'right-sidebar':
        return index === 0 || (layout === 'right-sidebar' && index === blocks.length - 1) ? 'column' : 'block';
      case 'grid':
        return 'card';
      case 'list':
        return 'block';
      case 'masonry':
        // Vary between card and column for masonry
        return index % 3 === 0 ? 'column' : 'card';
      default:
        return 'block';
    }
  };

  // Render component based on type
  const renderComponent = (block: CustomCardProps, index: number) => {
    const componentType = getComponentType(layout, index, block.type);
    const commonProps = {
      ...block,
      editable,
      onEdit: () => onEditCard?.(index),
      onUpload: onUploadDoc ? (file: File) => onUploadDoc(index, file) : undefined,
      onDeleteDoc: onDeleteDoc ? (docIdx: number) => onDeleteDoc(index, docIdx) : undefined,
    };

    switch (componentType) {
      case 'block':
        return <CustomBlock {...commonProps} />;
      case 'column':
        return <CustomColumn {...commonProps} />;
      case 'card':
        return <CustomCard {...commonProps} />;
      default:
        return <CustomBlock {...commonProps} />;
    }
  };

  // Special layouts
  if (layout === 'left-sidebar' && blocks.length > 1) {
    return (
      <div className={layoutClass}>
        <div className="md:col-span-1">
          <div className="relative">
            {renderComponent(blocks[0], 0)}
            {editable && onDeleteCard && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDeleteCard(0)}
                className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                title="Delete block"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
        <div className="md:col-span-3 flex flex-col gap-4">
          {blocks.slice(1).map((block, idx) => (
            <div key={idx+1} className="relative">
              {renderComponent(block, idx+1)}
              {editable && onDeleteCard && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteCard(idx+1)}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  title="Delete block"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'right-sidebar' && blocks.length > 1) {
    return (
      <div className={layoutClass}>
        <div className="md:col-span-3 flex flex-col gap-4">
          {blocks.slice(0, -1).map((block, idx) => (
            <div key={idx} className="relative">
              {renderComponent(block, idx)}
              {editable && onDeleteCard && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteCard(idx)}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  title="Delete block"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          ))}
        </div>
        <div className="md:col-span-1">
          <div className="relative">
            {renderComponent(blocks[blocks.length-1], blocks.length-1)}
            {editable && onDeleteCard && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDeleteCard(blocks.length-1)}
                className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                title="Delete block"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'hero' && blocks.length > 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="relative">
          {renderComponent(blocks[0], 0)}
          {editable && onDeleteCard && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteCard(0)}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.slice(1).map((block, idx) => (
            <div key={idx+1} className="relative">
              {renderComponent(block, idx+1)}
              {editable && onDeleteCard && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteCard(idx+1)}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  title="Delete block"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'masonry') {
    return (
      <div className={layoutClass}>
        {blocks.map((block, idx) => (
          <div key={idx} className="relative break-inside-avoid mb-6">
            {renderComponent(block, idx)}
            {editable && onDeleteCard && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDeleteCard(idx)}
                className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                title="Delete block"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default: grid/list/columns
  return (
    <div className={layoutClass}>
      {blocks.map((block, idx) => (
        <div key={idx} className="relative">
          {renderComponent(block, idx)}
          {editable && onDeleteCard && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteCard(idx)}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomPageRenderer;