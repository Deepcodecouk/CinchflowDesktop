import { useState, useRef } from 'react';

interface InlineAddProps {
  placeholder: string;
  onAdd: (value: string) => void | Promise<void>;
}

export function InlineAdd({ placeholder, onAdd }: InlineAddProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function scrollInputIntoView() {
    const el = inputRef.current;
    if (!el) return;
    const container = el.closest('[data-scroll-container]') as HTMLElement | null;
    if (!container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offset = 32;
    if (elRect.bottom + offset > containerRect.bottom) {
      container.scrollTop += elRect.bottom + offset - containerRect.bottom;
    }
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (trimmed) {
      setText('');
      await onAdd(trimmed);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        requestAnimationFrame(() => scrollInputIntoView());
      });
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={scrollInputIntoView}
      onBlur={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') setText('');
      }}
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-zinc-700/50 text-sm text-zinc-300 placeholder:text-zinc-600 px-1 py-0.5 outline-none focus:border-blue-500 transition-colors"
    />
  );
}
