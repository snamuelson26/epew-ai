"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ENTERPRISE_SEARCH_DEBOUNCE_MS,
  ENTERPRISE_SEARCH_SHORTCUT,
  ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
} from "./constants";

import {
  mergeToolbarClasses,
  normalizeSearchValue,
  shouldActivateSearchShortcut,
} from "./helpers";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search records...",
  debounceMs = ENTERPRISE_SEARCH_DEBOUNCE_MS,
  disabled = false,
  loading = false,
  className,
  ariaLabel = "Search records",
}: SearchInputProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] =
    useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handleShortcut = (
      event: KeyboardEvent,
    ): void => {
      if (
        !shouldActivateSearchShortcut(event) ||
        disabled
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener(
      "keydown",
      handleShortcut,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut,
      );
    };
  }, [disabled]);

  useEffect(() => {
    const normalizedValue =
      normalizeSearchValue(localValue);

    if (normalizedValue === value) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onChange(normalizedValue);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    debounceMs,
    localValue,
    onChange,
    value,
  ]);

  function handleClear(): void {
    if (disabled) {
      return;
    }

    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div
      className={mergeToolbarClasses(
        "relative",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      >
        ⌕
      </span>

      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={(event) =>
          setLocalValue(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "w-full pl-11 pr-24",
        )}
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"
            aria-label="Searching"
          />
        ) : null}

        {localValue.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="rounded-md px-1.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : (
          <kbd className="hidden rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-semibold text-slate-500 sm:inline-flex">
            {ENTERPRISE_SEARCH_SHORTCUT}
          </kbd>
        )}
      </div>
    </div>
  );
}