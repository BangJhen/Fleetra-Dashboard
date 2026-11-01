import { useState, useEffect, useRef, useCallback } from "react";

export interface DebouncedSearchOptions {
  /** Debounce delay in milliseconds (default: 350ms) */
  delay?: number;
  /** Minimum characters to trigger search (default: 0 = search on any input) */
  minChars?: number;
  /** Callback fired when debounced search value updates */
  onSearch?: (query: string) => void;
}

export function useDebouncedSearch(
  initialValue = "",
  options: DebouncedSearchOptions = {}
) {
  const { delay = 350, minChars = 0, onSearch } = options;
  const [inputVal, setInputVal] = useState(initialValue);
  const [debouncedVal, setDebouncedVal] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = inputVal.trim();
    if (trimmed.length > 0 && trimmed.length < minChars) {
      // Below threshold: don't trigger search query
      return;
    }

    timerRef.current = setTimeout(() => {
      setDebouncedVal(trimmed);
      onSearch?.(trimmed);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inputVal, delay, minChars, onSearch]);

  // Handle Enter key to bypass debounce delay immediately
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        const trimmed = inputVal.trim();
        setDebouncedVal(trimmed);
        onSearch?.(trimmed);
      }
    },
    [inputVal, onSearch]
  );

  // Instant clear
  const handleClear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setInputVal("");
    setDebouncedVal("");
    onSearch?.("");
  }, [onSearch]);

  return {
    value: inputVal,
    debouncedValue: debouncedVal,
    setValue: setInputVal,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputVal(e.target.value),
    onKeyDown: handleKeyDown,
    clear: handleClear,
    isDebouncing: inputVal.trim() !== debouncedVal,
  };
}
