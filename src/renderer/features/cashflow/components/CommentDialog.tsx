import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

interface CommentDialogProps {

  open: boolean;
  comment: string;
  onSave: (comment: string) => void;
  onClose: () => void;

}

export function CommentDialog({ open, comment, onSave, onClose }: CommentDialogProps) {

  const [value, setValue] = useState(comment);

  useEffect(() => {

    if (open) setValue(comment);

  }, [open, comment]);

  function handleSave() {

    const trimmed = value.trim();

    if (trimmed) {

      onSave(trimmed);

    }

  }

  function handleKeyDown(e: React.KeyboardEvent) {

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {

      e.preventDefault();
      handleSave();

    }

  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader
          title={comment ? 'Edit Comment' : 'Add Comment'}
          description="Add a brief comment about this budget cell."
        />
        <div className="px-6 py-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter comment..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!value.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

}
