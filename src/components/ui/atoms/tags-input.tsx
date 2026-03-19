/**
 * @file tags-input.tsx
 * @description Input de etiquetas premium - 100% responsive
 * @version 2.0.0 - Paleta oficial Origen
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, Plus, Tag, Info } from 'lucide-react';

export interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  tooltip?: string;
  className?: string;
  maxTags?: number;
  suggestions?: string[];
  required?: boolean;
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Añadir etiqueta...",
  label,
  helperText,
  error,
  tooltip,
  className,
  maxTags = 10,
  suggestions = [],
  required
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputId = React.useId();
  const errorId = `${inputId}-error`;

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  return (
    <div className={cn("w-full space-y-1.5 sm:space-y-2", className)}>
      {/* Label con tooltip */}
      {(label || tooltip) && (
        <div className="flex items-center gap-2">
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "text-xs sm:text-sm font-medium text-origen-bosque",
                error && "text-red-600"
              )}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="requerido">
                  *
                </span>
              )}
            </label>
          )}
          
          {tooltip && (
            <div className="group relative">
              <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-disabled cursor-help" />
              <div 
                className={cn(
                  "absolute left-0 top-4 sm:top-5 z-50 hidden group-hover:block",
                  "w-40 sm:w-48 p-2 rounded-lg bg-origen-oscuro text-white text-[10px] sm:text-xs",
                  "shadow-lg animate-in fade-in-0 zoom-in-95"
                )}
              >
                {tooltip}
                <div className="absolute -top-1 left-2 w-1.5 h-1.5 bg-origen-oscuro rotate-45" />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 min-h-[2.5rem] sm:min-h-[3rem] bg-white border rounded-xl">
        {value.map(tag => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1",
              "px-2 py-1 text-[10px] sm:text-xs rounded-lg",
              "bg-origen-crema text-origen-bosque",
              "border border-origen-pradera/30",
              "transition-all duration-200",
              "hover:bg-origen-pastel hover:border-origen-pradera"
            )}
          >
            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-origen-pradera" />
            <span>{tag}</span>
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-0.5 p-0.5 rounded-full hover:bg-origen-pradera/20 transition-colors"
              aria-label={`Eliminar etiqueta ${tag}`}
            >
              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </button>
          </span>
        ))}

        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length >= maxTags ? "Límite alcanzado" : placeholder}
          disabled={value.length >= maxTags}
          className={cn(
            "flex-1 min-w-[120px] sm:min-w-[150px]",
            "bg-transparent border-0 outline-none",
            "text-xs sm:text-sm placeholder:text-text-disabled",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus:ring-0"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {/* Sugerencias */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-32 sm:max-h-40 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleAddTag(suggestion)}
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-left text-xs sm:text-sm hover:bg-origen-crema transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contador y mensajes */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <p id={errorId} className="text-[10px] sm:text-xs text-red-600">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-[10px] sm:text-xs text-text-subtle">
              {helperText}
            </p>
          )}
        </div>
        
        <span className={cn(
          "text-[10px] sm:text-xs tabular-nums",
          value.length >= maxTags ? "text-amber-600" : "text-text-subtle"
        )}>
          {value.length}/{maxTags}
        </span>
      </div>
    </div>
  );
}