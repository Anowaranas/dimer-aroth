import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  gradient?: string;
  subText?: string;
  onClick?: () => void;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  gradient = 'from-blue-500 to-indigo-600',
  subText,
  onClick,
  className = '',
}) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div
      onClick={onClick}
      className={`glass-card p-3 sm:p-3.5 rounded-2xl relative overflow-hidden group transition-all duration-300 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {/* Top subtle highlight gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${gradient} opacity-80`} />

      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 dark:opacity-20 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`}
      />

      <div className="flex items-start justify-between gap-2 relative z-10 pt-0.5">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight truncate">
            {title}
          </p>

          {/* Value */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums tracking-tight leading-tight truncate">
            {value}
          </h2>

          {/* Change Indicator or SubText */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {change && (
              <p
                className={`flex items-center gap-0.5 text-[10px] sm:text-[11px] font-black ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight size={13} className="shrink-0 stroke-[2.5]" />
                ) : isNegative ? (
                  <ArrowDownRight size={13} className="shrink-0 stroke-[2.5]" />
                ) : null}
                <span className="truncate">{change}</span>
              </p>
            )}

            {subText && (
              <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                {subText}
              </span>
            )}
          </div>
        </div>

        {/* Icon with Rich Gradient Container */}
        {Icon && (
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/30`}
          >
            <Icon size={18} className="text-white drop-shadow-xs" />
          </div>
        )}
      </div>
    </div>
  );
};
