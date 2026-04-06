import { useState, useEffect, useRef } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const AutocompleteInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  maxLength,
  disabled
}: AutocompleteInputProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length >= 3) {
        try {
          const res = await fetch(`/api/systems/search?q=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
          }
        } catch (e) {
          console.error("Autocomplete fetch error:", e);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => !disabled && value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={className}
      />
      {showSuggestions && (
        <div className="absolute z-[110] left-0 right-0 mt-1 bg-bg-main border border-accent/40 shadow-2xl max-h-48 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-2 text-[11px] uppercase tracking-widest text-text-main hover:bg-accent/20 transition-colors border-b border-accent/10 last:border-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
