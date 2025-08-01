import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, UploadCloud, Download, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export interface CustomCardProps {
  title: string;
  body: string;
  docs: Array<{ name: string; url: string }>;
  onUpload?: (file: File) => void;
  editable?: boolean;
  onEdit?: () => void;
  onDeleteDoc?: (index: number) => void;
  type?: 'block' | 'column' | 'card';
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  whileHover: { 
    scale: 1.02, 
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    y: -5
  },
  whileTap: { scale: 0.98 }
};

const docVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 }
};

export const CustomCard: React.FC<CustomCardProps> = ({ 
  title, 
  body, 
  docs, 
  onUpload, 
  editable, 
  onEdit,
  onDeleteDoc 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="whileHover"
      whileTap="whileTap"
      className="relative group bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 pointer-events-none"
      />
      
      {/* Card content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {title}
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
          </div>
          {editable && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEdit}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Edit block"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </motion.button>
          )}
        </div>

        {/* Body content */}
        <div className="text-gray-700 dark:text-gray-200 mb-6 leading-relaxed whitespace-pre-line">
          {body}
        </div>

        {/* Documents section */}
        <div className="space-y-3">
          {docs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents ({docs.length})
              </h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {docs.map((doc, idx) => (
                    <motion.div
                      key={idx}
                      variants={docVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            Click to download
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.a
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </motion.a>
                        {onDeleteDoc && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDeleteDoc(idx)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Upload button */}
          {onUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) onUpload(e.target.files[0]);
                }}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <UploadCloud className="w-4 h-4" />
                Add Document
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/10 to-pink-500/10 rounded-bl-full pointer-events-none" />
    </motion.div>
  );
};

export default CustomCard;