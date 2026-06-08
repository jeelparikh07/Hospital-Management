'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SelectProps {
  label?: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <motion.button
        type="button"
        className={cn(
          'input-modern w-full px-4 py-3 bg-white/80 border rounded-xl text-left flex items-center justify-between',
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-200 focus:ring-primary-500',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.99 }}
      >
        <span className={cn(!selectedOption && 'text-gray-400')}>
          {selectedOption?.label || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    className={cn(
                      'w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary-50 transition-colors',
                      value === option.value && 'bg-primary-50 text-primary-600'
                    )}
                    style={{ transitionDelay: `${index * 30}ms` }}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                    }}
                    whileHover={{ x: 4 }}
                  >
                    {option.icon && (
                      <span className="text-gray-400">{option.icon}</span>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-primary-600"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
