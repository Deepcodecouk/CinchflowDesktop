import { useState, useCallback } from 'react';

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (opts: ConfirmState) => setState(opts),
    [],
  );

  const close = useCallback(() => setState(null), []);

  return {
    confirmProps: state
      ? {
          open: true,
          onClose: close,
          onConfirm: state.onConfirm,
          title: state.title,
          message: state.message,
          confirmLabel: state.confirmLabel,
          destructive: state.destructive,
        }
      : { open: false, onClose: close, onConfirm: () => {}, title: '', message: '' },
    confirm,
  };
}
