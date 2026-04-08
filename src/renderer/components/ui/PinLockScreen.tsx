import { useState } from 'react';
import { Lock } from 'lucide-react';
import { PinInput } from './PinInput';

interface PinLockScreenProps {

  onUnlock: () => void;

}

export function PinLockScreen({ onUnlock }: PinLockScreenProps) {

  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [verifying, setVerifying] = useState(false);

  async function handlePinComplete(pin: string) {

    setVerifying(true);
    setError('');

    const res = await window.api.pin.verify(pin);

    if (res.success && res.data) {
      onUnlock();
    } else {
      setError('Incorrect PIN. Please try again.');
      setResetKey((k) => k + 1);
      setVerifying(false);
    }

  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Lock className="w-8 h-8 text-zinc-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-100">Locked</h1>
          <p className="text-sm text-zinc-400 mt-1">Enter your PIN to continue</p>
        </div>
        <PinInput
          onComplete={handlePinComplete}
          error={error}
          disabled={verifying}
          resetKey={resetKey}
        />
      </div>
    </div>
  );

}
