import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { PinInput } from '../ui/PinInput';

type SetupPhase = 'enter' | 'confirm';

interface PinSetupDialogProps {

  open: boolean;
  onClose: () => void;
  onPinSet: () => void;

}

export function PinSetupDialog({ open, onClose, onPinSet }: PinSetupDialogProps) {

  const [phase, setPhase] = useState<SetupPhase>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const reset = useCallback(() => {

    setPhase('enter');
    setFirstPin('');
    setError('');
    setResetKey((k) => k + 1);

  }, []);

  function handleClose() {

    reset();
    onClose();

  }

  function handleFirstPinComplete(pin: string) {

    setFirstPin(pin);
    setPhase('confirm');
    setError('');
    setResetKey((k) => k + 1);

  }

  async function handleConfirmPinComplete(pin: string) {

    if (pin.toLowerCase() !== firstPin.toLowerCase()) {
      setError('PINs do not match. Please try again.');
      setPhase('enter');
      setFirstPin('');
      setResetKey((k) => k + 1);
      return;
    }

    const res = await window.api.pin.set(pin);
    if (res.success) {
      reset();
      onPinSet();
    } else {
      setError(res.error || 'Failed to set PIN');
    }

  }

  const title = phase === 'enter' ? 'Choose a PIN' : 'Confirm your PIN';
  const description = phase === 'enter'
    ? 'Enter a 4-character alphanumeric PIN'
    : 'Re-enter your PIN to confirm';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader title={title} description={description} />
        <div className="p-6 pt-4 flex justify-center">
          <PinInput
            onComplete={phase === 'enter' ? handleFirstPinComplete : handleConfirmPinComplete}
            error={error}
            resetKey={resetKey}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

}
