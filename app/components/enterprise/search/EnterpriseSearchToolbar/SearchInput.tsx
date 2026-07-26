"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ENTERPRISE_SEARCH_DEBOUNCE_MS,
  ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER,
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
  autoFocus?: boolean;
  showShortcut?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = ENTERPRISE_SEARCH_DEFAULT_PLACEHOLDER,
  debounceMs = ENTERPRISE_SEARCH_DEBOUNCE_MS,
  disabled = false,
  loading = false,
  className,
  autoFocus = false,
  showShortcut = true,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] =
    useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    function handleSearchShortcut(
      event: KeyboardEvent,
    ): void {
      if (
        !shouldActivateSearchShortcut(event) ||
        disabled
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener(
      "keydown",
      handleSearchShortcut,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleSearchShortcut,
      );
    };
  }, [disabled]);

  useEffect(() => {
    const normalizedValue =
      normalizeSearchValue(internalValue);

    if (normalizedValue === value) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onChange(normalizedValue);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    debounceMs,
    internalValue,
    onChange,
    value,
  ]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    setInternalValue(event.target.value);
  }

  function handleClear(): void {
    if (disabled) {
      return;
    }

    setInternalValue("");
    onChange("");
    inputRef.current?.focus();
  }

  const hasValue = internalValue.length > 0;

  return (
    <div
      className={mergeToolbarClasses(
        "relative min-w-0 flex-1",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      >
        ⌕
      </span>

      <input
        ref={inputRef}
        type="search"
        value={internalValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={mergeToolbarClasses(
          ENTERPRISE_TOOLBAR_CONTROL_CLASSES,
          "w-full pl-10",
          hasValue || loading || showShortcut
            ? "pr-24"
            : "pr-4",
          disabled &&
            "cursor-not-allowed opacity-50",
        )}
        aria-label={placeholder}
        aria-busy={loading}
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"
            aria-label="Searching"
          />
        ) : null}

        {hasValue && !loading ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        ) : null}

        {showShortcut &&
        !hasValue &&
        !loading ? (
          <kbd className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-semibold text-slate-500">
            {ENTERPRISE_SEARCH_SHORTCUT}
          </kbd>
        ) : null}
      </div>
    </div>
  );
}