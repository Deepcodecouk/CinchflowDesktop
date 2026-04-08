import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useConfirm } from '../hooks/use-confirm';
import { callIpc, toErrorMessage } from '../lib/ipc-client';
import type { DbNote } from '../../shared/types';

export function NotesPage() {
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DbNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { confirmProps, confirm } = useConfirm();

  const loadNotes = useCallback(async () => {
    setLoading(true);

    try {
      const noteList = await callIpc<DbNote[]>(window.api.notes.findAll(), 'Failed to load notes');
      setNotes(noteList ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to load notes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function openCreate() {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setFormOpen(true);
  }

  function openEdit(note: DbNote) {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      return;
    }

    try {
      if (editingNote) {
        await callIpc(
          window.api.notes.update(editingNote.id, { title: title.trim(), content }),
          'Failed to update note',
        );
      } else {
        await callIpc(
          window.api.notes.create({ title: title.trim(), content }),
          'Failed to create note',
        );
      }

      setFormOpen(false);
      setErrorMessage(null);
      await loadNotes();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to save note'));
    }
  }

  function handleDelete(id: string) {
    confirm({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      onConfirm: async () => {
        try {
          await callIpc(window.api.notes.delete(id), 'Failed to delete note');
          setErrorMessage(null);
          await loadNotes();
        } catch (error) {
          setErrorMessage(toErrorMessage(error, 'Failed to delete note'));
        }
      },
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-700/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-400">No notes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-medium text-zinc-100">{note.title}</h3>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(note)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap text-xs text-zinc-400">{note.content}</p>
              <div className="mt-3 text-[10px] text-zinc-600">
                {new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(openState) => !openState && setFormOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader
            title={editingNote ? 'Edit Note' : 'New Note'}
            description="Keep notes related to your finances"
          />
          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Note title"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Content</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your note..."
                rows={8}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
