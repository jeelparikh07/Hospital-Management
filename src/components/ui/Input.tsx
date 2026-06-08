'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  rightElement,
  className,
  id,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            'input-modern w-full px-4 py-3 bg-white/80 text-gray-900 placeholder-gray-400 border rounded-xl transition-all duration-300',
            icon && 'pl-11',
            rightElement && 'pr-12',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
        {/* Animated border on focus */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={false}
          animate={{
            boxShadow: isFocused
              ? '0 0 0 4px rgba(37, 99, 235, 0.1)'
              : '0 0 0 0px rgba(37, 99, 235, 0)',
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
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
