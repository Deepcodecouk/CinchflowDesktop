import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_COLOURS } from '../../../shared/constants';
import { cn } from '../../lib/utils';

interface ColourPickerProps {
  value: string;
  colours?: string[];
  onSelect: (colour: string) => void;
}

export function ColourPicker({ value, colours = CATEGORY_COLOURS, onSelect }: ColourPickerProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverHeight = 140;
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < popoverHeight + 8;
    setPos({
      left: rect.left,
      top: above ? rect.top - popoverHeight - 4 : rect.bottom + 4,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full border border-zinc-600 flex-shrink-0"
        style={{ backgroundColor: value }}
        title="Change colour"
      />
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[200] pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 grid grid-cols-4 gap-1 w-32 shadow-xl"
          style={{ top: pos.top, left: pos.left }}
        >
          {colours.map((c) => (
            <button
              key={c}
              onClick={() => { onSelect(c); setOpen(false); }}
              className={cn(
                'w-6 h-6 rounded-full border transition-transform hover:scale-110',
                c === value ? 'border-white scale-110' : 'border-zinc-600',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
