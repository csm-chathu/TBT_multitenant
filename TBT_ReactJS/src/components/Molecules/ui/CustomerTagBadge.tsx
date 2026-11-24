import React from 'react';

interface CustomerTagBadgeProps {
  tag?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const PRESET_CUSTOMER_TAGS = [
  'Annoying / Difficult',
  'VIP Customer',
  'Frequent Caller',
  'High Risk',
  'New Customer',
  'Regular Customer',
] as const;

export const getCustomerTagStyle = (tag: string): { bgClass: string; textClass: string; dotClass: string; borderClass: string } => {
  const normalized = tag.toLowerCase().trim();

  if (
    normalized.includes('annoying') ||
    normalized.includes('difficult') ||
    normalized.includes('abusive') ||
    normalized.includes('blocked') ||
    normalized.includes('spam') ||
    normalized.includes('warning')
  ) {
    return {
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-300 font-semibold',
      dotClass: 'bg-red-500',
      borderClass: 'border-red-300 dark:border-red-700',
    };
  }

  if (normalized.includes('vip') || normalized.includes('gold') || normalized.includes('premium')) {
    return {
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-800 dark:text-amber-300 font-semibold',
      dotClass: 'bg-amber-500',
      borderClass: 'border-amber-300 dark:border-amber-700',
    };
  }

  if (normalized.includes('frequent') || normalized.includes('escalated') || normalized.includes('purple')) {
    return {
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      textClass: 'text-purple-700 dark:text-purple-300 font-semibold',
      dotClass: 'bg-purple-500',
      borderClass: 'border-purple-300 dark:border-purple-700',
    };
  }

  if (normalized.includes('risk') || normalized.includes('danger') || normalized.includes('high')) {
    return {
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-700 dark:text-orange-300 font-semibold',
      dotClass: 'bg-orange-500',
      borderClass: 'border-orange-300 dark:border-orange-700',
    };
  }

  if (normalized.includes('new') || normalized.includes('first')) {
    return {
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-300 font-semibold',
      dotClass: 'bg-blue-500',
      borderClass: 'border-blue-300 dark:border-blue-700',
    };
  }

  if (normalized.includes('regular') || normalized.includes('normal') || normalized.includes('good')) {
    return {
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      textClass: 'text-emerald-700 dark:text-emerald-300 font-semibold',
      dotClass: 'bg-emerald-500',
      borderClass: 'border-emerald-300 dark:border-emerald-700',
    };
  }

  // Default custom tag badge
  return {
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-200 font-semibold',
    dotClass: 'bg-slate-500',
    borderClass: 'border-slate-300 dark:border-slate-600',
  };
};

const CustomerTagBadge: React.FC<CustomerTagBadgeProps> = ({ tag, className = '', size = 'md' }) => {
  if (!tag || !tag.trim()) return null;

  const { bgClass, textClass, dotClass, borderClass } = getCustomerTagStyle(tag);

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1.5' 
    : 'px-2.5 py-1 text-xs sm:text-sm gap-2';

  const isRedTag = dotClass.includes('bg-red-500');

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bgClass} ${textClass} ${borderClass} ${sizeClasses} shadow-xs whitespace-nowrap shrink-0 ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}${isRedTag ? ' animate-pulse' : ''}`} />
      <span>{tag.trim()}</span>
    </span>
  );
};

export default CustomerTagBadge;
