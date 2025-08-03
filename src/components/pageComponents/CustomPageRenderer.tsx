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
  // Enhanced layout logic with more meaningful differences
  let layoutClass = '';
  let containerClass = '';
  
  switch (layout) {
    case 'grid':
      layoutClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'columns-2':
      layoutClass = 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8';
      containerClass = 'max-w-6xl mx-auto';
      break;
    case 'columns-3':
      layoutClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'list':
      layoutClass = 'flex flex-col gap-6 lg:gap-8';
      containerClass = 'max-w-4xl mx-auto';
      break;
    case 'left-sidebar':
      layoutClass = 'grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'right-sidebar':
      layoutClass = 'grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'hero':
      layoutClass = 'flex flex-col gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'masonry':
      layoutClass = 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'featured':
      layoutClass = 'flex flex-col gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'magazine':
      layoutClass = 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'dashboard':
      layoutClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6';
      containerClass = 'max-w-7xl mx-auto';
      break;
    case 'timeline':
      layoutClass = 'flex flex-col gap-6 lg:gap-8';
      containerClass = 'max-w-4xl mx-auto';
      break;
    default:
      layoutClass = 'flex flex-col gap-6 lg:gap-8';
      containerClass = 'max-w-4xl mx-auto';
  }

  // Enhanced component type logic with more meaningful differences
  const getComponentType = (layout: string, index: number, blockType?: string) => {
    // If block has a specific type, use it
    if (blockType) {
      return blockType;
    }
    
    // Enhanced layout-based logic
    switch (layout) {
      case 'hero':
        return index === 0 ? 'block' : 'card';
      case 'featured':
        return index === 0 ? 'block' : index < 3 ? 'column' : 'card';
      case 'magazine':
        if (index === 0) return 'block';
        if (index < 4) return 'column';
        return 'card';
      case 'dashboard':
        return 'card';
      case 'timeline':
        return index % 2 === 0 ? 'block' : 'column';
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
        // Vary between card and column for masonry with more variety
        return index % 4 === 0 ? 'block' : index % 3 === 0 ? 'column' : 'card';
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

  // Enhanced special layouts with more meaningful differences

  // Featured layout - First block is large, next 2 are medium, rest are small
  if (layout === 'featured' && blocks.length > 0) {
    return (
      <div className={containerClass}>
        <div className={layoutClass}>
          {/* Featured block */}
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
          
          {/* Secondary blocks */}
          {blocks.slice(1, 3).map((block, idx) => (
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
          
          {/* Remaining blocks in grid */}
          {blocks.slice(3).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 col-span-full">
              {blocks.slice(3).map((block, idx) => (
                <div key={idx+3} className="relative">
                  {renderComponent(block, idx+3)}
                  {editable && onDeleteCard && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteCard(idx+3)}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Magazine layout - Complex grid with different sizes
  if (layout === 'magazine' && blocks.length > 0) {
    return (
      <div className={containerClass}>
        <div className={layoutClass}>
          {/* Main featured block */}
          <div className="lg:col-span-8 relative">
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
          
          {/* Sidebar blocks */}
          {blocks.slice(1, 4).map((block, idx) => (
            <div key={idx+1} className="lg:col-span-4 relative">
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
          
          {/* Bottom grid */}
          {blocks.slice(4).length > 0 && (
            <>
              {blocks.slice(4, 7).map((block, idx) => (
                <div key={idx+4} className="lg:col-span-4 relative">
                  {renderComponent(block, idx+4)}
                  {editable && onDeleteCard && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteCard(idx+4)}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
              
              {/* Remaining blocks in smaller grid */}
              {blocks.slice(7).map((block, idx) => (
                <div key={idx+7} className="lg:col-span-3 relative">
                  {renderComponent(block, idx+7)}
                  {editable && onDeleteCard && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteCard(idx+7)}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // Timeline layout - Alternating blocks with visual timeline
  if (layout === 'timeline' && blocks.length > 0) {
    return (
      <div className={containerClass}>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
          
          <div className="space-y-8">
            {blocks.map((block, idx) => (
              <div key={idx} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-6 top-8 w-4 h-4 bg-red-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"></div>
                
                <div className="ml-16 relative">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Left sidebar layout
  if (layout === 'left-sidebar' && blocks.length > 1) {
    return (
      <div className={containerClass}>
        <div className={layoutClass}>
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-3 flex flex-col gap-6">
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
      </div>
    );
  }

  // Right sidebar layout
  if (layout === 'right-sidebar' && blocks.length > 1) {
    return (
      <div className={containerClass}>
        <div className={layoutClass}>
          <div className="lg:col-span-3 flex flex-col gap-6">
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
          <div className="lg:col-span-1">
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
      </div>
    );
  }

  // Hero layout
  if (layout === 'hero' && blocks.length > 0) {
    return (
      <div className={containerClass}>
        <div className="flex flex-col gap-6 lg:gap-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      </div>
    );
  }

  // Masonry layout
  if (layout === 'masonry') {
    return (
      <div className={containerClass}>
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
      </div>
    );
  }

  // Default: grid/list/columns
  return (
    <div className={containerClass}>
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
    </div>
  );
};

export default CustomPageRenderer;