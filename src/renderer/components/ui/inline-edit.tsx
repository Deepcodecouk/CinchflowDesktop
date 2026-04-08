import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}

export function InlineEdit({ value, onSave, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function handleSave() {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setText(value);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setText(value);
            setEditing(false);
          }
        }}
        className={cn(
          'bg-zinc-700 border border-zinc-600 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-500',
          className,
        )}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('text-sm cursor-pointer hover:underline', className)}
    >
      {value}
    </span>
  );
}
