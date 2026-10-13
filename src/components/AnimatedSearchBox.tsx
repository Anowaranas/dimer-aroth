import React, { useState, useEffect } from 'react';
import { Search, Check, Loader2, X, Sparkles } from 'lucide-react';
import { hapticCancel } from '../utils/haptics';

interface AnimatedSearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
  badgeText?: string;
  buttonText?: string;
  resultsCount?: number;
  className?: string;
  compact?: boolean;
}

export const AnimatedSearchBox: React.FC<AnimatedSearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'অনুসন্ধান করুন...',
  id = 'animated-search-box',
  badgeText,
  buttonText = 'খুঁজুন',
  resultsCount,
  className = '',
  compact = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Micro-typing debounce simulation for spinner effect
  useEffect(() => {
    if (value.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 220);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [value]);

  const handleClear = () => {
    hapticCancel();
    onChange('');
  };

  const hasValue = value.trim().length > 0;
  const hasMatches = hasValue && (resultsCount === undefined || resultsCount > 0);

  return (
    <div id={`${id}-wrapper`} className={`search-wrapper relative ${className}`}>
      {/* Optional Badge Header (like screenshot's "Premium Search") */}
      {badgeText && !compact && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 border border-blue-500/20">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>{badgeText}</span>
          </div>
          {resultsCount !== undefined && hasValue && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              ({resultsCount} টি পাওয়া গেছে)
            </span>
          )}
        </div>
      )}

      {/* Main Animated Search Box Container */}
      <div
        id={id}
        className={`search-box relative flex items-center gap-1.5 rounded-2xl glass-card transition-all duration-300 border overflow-hidden ${
          compact ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
        } ${
          isFocused
            ? 'ring-2 ring-blue-500/50 border-blue-500/80 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20'
            : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        }`}
      >
        {/* Left Search Icon / Dynamic Status */}
        <div className="icon-wrapper flex items-center justify-center pl-2.5 pr-1 text-slate-400 dark:text-slate-400 shrink-0">
          {isSearching ? (
            <Loader2 className="spinner w-4 h-4 animate-spin text-blue-500" />
          ) : hasMatches ? (
            <Check className="success-icon w-4 h-4 text-emerald-500 stroke-[2.5]" />
          ) : (
            <Search className={`search-icon w-4 h-4 transition-colors ${isFocused ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
        </div>

        {/* Search Input */}
        <input
          id={`${id}-input`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="search-input w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-hidden py-1 min-w-0"
        />

        {/* Clear Button (X) */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            title="মুছে ফেলুন"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Animated Action Button (Search Button with state) */}
        <button
          type="button"
          onClick={() => {}}
          className={`search-button shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 ${
            isFocused || hasValue
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
          }`}
        >
          <span className="button-text hidden xs:inline sm:inline">{buttonText}</span>
          <Search className="w-3.5 h-3.5 xs:hidden sm:hidden" />
        </button>

        {/* Animated Scanning Line (Laser scanning bar from screenshot reference) */}
        {(isFocused || isSearching) && (
          <div
            id={`${id}-scanning-line`}
            className="scanning-line absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden pointer-events-none"
          >
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 to-blue-600 animate-scanline" />
          </div>
        )}
      </div>
    </div>
  );
};
