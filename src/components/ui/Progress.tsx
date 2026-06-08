'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'primary',
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    primary: 'from-primary-600 to-secondary-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-orange-500 to-red-500',
    danger: 'from-red-500 to-rose-500',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{value}</span>
          <span className="text-gray-600">{max}</span>
        </div>
      )}
      <div className={cn('bg-gray-100 rounded-full overflow-hidden', sizes[size])}>
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full bg-gradient-to-r rounded-full', colors[color])}
          />
        ) : (
          <div
            className={cn('h-full bg-gradient-to-r rounded-full', colors[color])}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showValue?: boolean;
  color?: string;
  strokeWidth?: number;
}

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  className,
  showValue = true,
  color = '#2563EB',
  strokeWidth = 8,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizes = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <svg className={cn('transform -rotate-90', sizes[size])} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

interface StepProgressProps {
  steps: { label: string; status: 'pending' | 'active' | 'completed' }[];
  className?: string;
}

export function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          {/* Step Circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center border-2',
              step.status === 'completed' && 'bg-green-500 border-green-500',
              step.status === 'active' && 'bg-primary-600 border-primary-600',
              step.status === 'pending' && 'bg-gray-100 border-gray-300'
            )}
          >
            {step.status === 'completed' ? (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            ) : (
              <span
                className={cn(
                  'text-sm font-medium',
                  step.status === 'active' && 'text-white',
                  step.status === 'pending' && 'text-gray-400'
                )}
              >
                {index + 1}
              </span>
            )}
          </motion.div>

          {/* Label */}
          {index < steps.length - 1 && (
            <>
              <span
                className={cn(
                  'mx-2 text-sm whitespace-nowrap hidden sm:inline',
                  step.status === 'completed' || step.status === 'active'
                    ? 'text-gray-900'
                    : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
              {/* Connector Line */}
              <div
                className={cn(
                  'w-8 sm:w-16 h-0.5 mx-2',
                  steps[index + 1].status === 'completed' ||
                    steps[index + 1].status === 'active'
                    ? 'bg-primary-600'
                    : 'bg-gray-200'
                )}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
