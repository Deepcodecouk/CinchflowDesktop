import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { PinInput } from '../ui/PinInput';

interface PinClearDialogProps {

  open: boolean;
  onClose: () => void;
  onPinCleared: () => void;

}

export function PinClearDialog({ open, onClose, onPinCleared }: PinClearDialogProps) {

  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);

  function handleClose() {

    setError('');
    setResetKey((k) => k + 1);
    onClose();

  }

  async function handlePinComplete(pin: string) {

    const res = await window.api.pin.clear(pin);
    if (res.success) {
      setError('');
      setResetKey((k) => k + 1);
      onPinCleared();
    } else {
      setError(res.error === 'Incorrect PIN' ? 'Incorrect PIN. Please try again.' : (res.error || 'Failed to clear PIN'));
      setResetKey((k) => k + 1);
    }

  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader title="Clear PIN" description="Enter your current PIN to remove it" />
        <div className="p-6 pt-4 flex justify-center">
          <PinInput
            onComplete={handlePinComplete}
            error={error}
            resetKey={resetKey}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

}
