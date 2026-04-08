import { useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface PinInputProps {

  onComplete: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  resetKey?: number;

}

const PIN_LENGTH = 4;

export function PinInput({ onComplete, error, disabled = false, resetKey = 0 }: PinInputProps) {

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const valuesRef = useRef<string[]>(Array(PIN_LENGTH).fill(''));

  useEffect(() => {

    valuesRef.current = Array(PIN_LENGTH).fill('');
    for (const ref of inputRefs.current) {
      if (ref) ref.value = '';
    }
    inputRefs.current[0]?.focus();

  }, [resetKey]);

  const focusInput = useCallback((index: number) => {

    inputRefs.current[index]?.focus();

  }, []);

  const getPin = useCallback((): string => {

    return valuesRef.current.join('');

  }, []);

  function handleInput(index: number, e: React.FormEvent<HTMLInputElement>) {

    const input = e.currentTarget;
    const raw = input.value.replace(/\*/g, '');

    // Only allow alphanumeric
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
    valuesRef.current[index] = cleaned;
    input.value = cleaned ? '*' : '';

    if (cleaned && index < PIN_LENGTH - 1) {
      focusInput(index + 1);
    }

    if (cleaned && index === PIN_LENGTH - 1) {
      const pin = getPin();
      if (pin.length === PIN_LENGTH) {
        onComplete(pin);
      }
    }

  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {

    if (e.key === 'Backspace') {
      if (valuesRef.current[index]) {
        valuesRef.current[index] = '';
        e.currentTarget.value = '';
      } else if (index > 0) {
        valuesRef.current[index - 1] = '';
        const prev = inputRefs.current[index - 1];
        if (prev) prev.value = '';
        focusInput(index - 1);
      }
    }

  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {

    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_LENGTH);

    for (let i = 0; i < PIN_LENGTH; i++) {
      valuesRef.current[i] = text[i] ?? '';
      const ref = inputRefs.current[i];
      if (ref) ref.value = text[i] ? '*' : '';
    }

    if (text.length === PIN_LENGTH) {
      onComplete(text);
    } else {
      focusInput(Math.min(text.length, PIN_LENGTH - 1));
    }

  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            maxLength={1}
            disabled={disabled}
            autoComplete="off"
            className={cn(
              'w-12 h-14 text-center text-xl font-mono font-bold rounded-lg border-2 bg-zinc-800 text-zinc-100 outline-none transition-colors',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-red-500' : 'border-zinc-600',
            )}
            onInput={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );

}
