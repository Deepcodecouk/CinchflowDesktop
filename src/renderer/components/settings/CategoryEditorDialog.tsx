import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { useConfirm } from '../../hooks/use-confirm';
import { callIpc, toErrorMessage } from '../../lib/ipc-client';
import { useCategoryEditor } from './category-editor/use-category-editor';
import { CATEGORY_HEADER_TYPES } from '../../../shared/constants';
import { TypePanel } from './category-editor/TypePanel';
import {
  DeleteCategoryDialog,
  type DeleteConfirmState,
} from './category-editor/DeleteCategoryDialog';
import {
  parseHeaderDragId,
  parseCatDragId,
  parseTypeDropId,
  parseHeaderDropId,
  type ActiveDrag,
} from './category-editor/dnd-utils';
import type { CategoryHeaderType } from '../../../shared/types';

interface CategoryEditorDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

export function CategoryEditorDialog({
  open,
  onClose,
  accountId,
  accountName,
}: CategoryEditorDialogProps) {
  const {
    hierarchies,
    loading,
    errorMessage,
    scrollRef,
    loadData,
    getHierarchiesForType,
    handleCreateHeader,
    handleUpdateHeader,
    handleDeleteHeader: deleteHeader,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory: deleteCategory,
  } = useCategoryEditor(accountId, open);

  const { confirmProps, confirm } = useConfirm();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (!activeDrag) {
      setDragPos(null);
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      setDragPos({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeDrag]);

  function handleDeleteHeader(id: string) {
    const header = hierarchies.find((hierarchy) => hierarchy.header.id === id)?.header;

    confirm({
      title: 'Delete Header',
      message: `Delete "${header?.name ?? 'this header'}" and all its categories?`,
      onConfirm: async () => {
        await deleteHeader(id);
      },
    });
  }

  async function handleDeleteCategory(id: string) {
    try {
      const count = await callIpc<number>(window.api.categories.countTransactions(id), 'Failed to check category usage');
      const category = hierarchies
        .flatMap((hierarchy) => hierarchy.categories)
        .find((item) => item.id === id);

      if (count > 0) {
        setDeleteConfirm({
          categoryId: id,
          categoryName: category?.name ?? 'Unknown',
          transactionCount: count,
          reassignTo: null,
        });
        setLocalErrorMessage(null);
        return;
      }

      confirm({
        title: 'Delete Category',
        message: `Delete "${category?.name ?? 'this category'}"?`,
        onConfirm: async () => {
          await deleteCategory(id);
        },
      });
    } catch (error) {
      setLocalErrorMessage(toErrorMessage(error, 'Failed to check category usage'));
    }
  }

  async function handleConfirmDeleteWithReassignment() {
    if (!deleteConfirm) {
      return;
    }

    try {
      await callIpc<boolean>(
        window.api.categories.deleteWithReassignment(deleteConfirm.categoryId, deleteConfirm.reassignTo),
        'Failed to delete category',
      );
      setDeleteConfirm(null);
      setLocalErrorMessage(null);
      await loadData();
    } catch (error) {
      setLocalErrorMessage(toErrorMessage(error, 'Failed to delete category'));
    }
  }

  function getReassignmentOptions(excludeId: string) {
    const options: Array<{ id: string; name: string; headerName: string }> = [];

    for (const hierarchy of hierarchies) {
      for (const category of hierarchy.categories) {
        if (category.id !== excludeId) {
          options.push({ id: category.id, name: category.name, headerName: hierarchy.header.name });
        }
      }
    }

    return options;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const headerId = parseHeaderDragId(id);
    const categoryId = parseCatDragId(id);

    if (headerId) {
      setActiveDrag({ type: 'header', id: headerId });
    } else if (categoryId) {
      setActiveDrag({ type: 'category', id: categoryId });
    }

    const activatorEvent = event.activatorEvent as MouseEvent;
    if (activatorEvent) {
      setDragPos({ x: activatorEvent.clientX, y: activatorEvent.clientY });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }

    const drag = activeDrag;
    setActiveDrag(null);

    if (!event.over || !drag) {
      return;
    }

    const overId = String(event.over.id);

    if (drag.type === 'header') {
      const targetType = parseTypeDropId(overId);
      if (!targetType) {
        return;
      }

      const header = hierarchies.find((hierarchy) => hierarchy.header.id === drag.id)?.header;
      if (!header || header.type === targetType) {
        return;
      }

      await handleUpdateHeader(drag.id, { type: targetType });
      return;
    }

    const targetHeaderId = parseHeaderDropId(overId);
    if (!targetHeaderId) {
      return;
    }

    const category = hierarchies
      .flatMap((hierarchy) => hierarchy.categories)
      .find((item) => item.id === drag.id);

    if (!category || category.category_header_id === targetHeaderId) {
      return;
    }

    await handleUpdateCategory(drag.id, { category_header_id: targetHeaderId });
  }

  function handleDragCancel() {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }

    setActiveDrag(null);
  }

  function getDragOverlay() {
    if (!activeDrag || !dragPos) {
      return null;
    }

    if (activeDrag.type === 'header') {
      const hierarchy = hierarchies.find((item) => item.header.id === activeDrag.id);
      if (!hierarchy) {
        return null;
      }

      return (
        <div className="flex items-center gap-2 whitespace-nowrap rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 shadow-lg">
          <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: hierarchy.header.colour }} />
          <span className="text-sm font-medium text-zinc-200">{hierarchy.header.name}</span>
        </div>
      );
    }

    for (const hierarchy of hierarchies) {
      const category = hierarchy.categories.find((item) => item.id === activeDrag.id);
      if (!category) {
        continue;
      }

      return (
        <div className="flex items-center gap-2 whitespace-nowrap rounded border border-zinc-600 bg-zinc-800 px-3 py-1 shadow-lg">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: hierarchy.header.colour }} />
          <span className="text-sm text-zinc-300">{category.name}</span>
        </div>
      );
    }

    return null;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onClose();
    }
  }

  function makeCreateHeaderHandler(type: CategoryHeaderType) {
    return (name: string) => handleCreateHeader(type, name);
  }

  const combinedErrorMessage = localErrorMessage ?? errorMessage;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
        <div className="pb-4">
          <DialogHeader title={`Categories - ${accountName}`} />
        </div>
        <div ref={scrollRef} data-scroll-container className="flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          {combinedErrorMessage && (
            <div className="rounded-lg border border-red-700/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {combinedErrorMessage}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-zinc-400">Loading...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="space-y-4">
                {CATEGORY_HEADER_TYPES.map((type) => (
                  <TypePanel
                    key={type}
                    type={type}
                    hierarchies={getHierarchiesForType(type)}
                    activeDrag={activeDrag}
                    expandTimerRef={expandTimerRef}
                    onCreateHeader={makeCreateHeaderHandler(type)}
                    onUpdateHeader={handleUpdateHeader}
                    onDeleteHeader={handleDeleteHeader}
                    onCreateCategory={handleCreateCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                ))}
              </div>
              {dragPos &&
                createPortal(
                  <div
                    className="pointer-events-none fixed z-[100]"
                    style={{ left: dragPos.x + 12, top: dragPos.y - 12 }}
                  >
                    {getDragOverlay()}
                  </div>,
                  document.body,
                )}
            </DndContext>
          )}
        </div>
      </DialogContent>

      <DeleteCategoryDialog
        state={deleteConfirm}
        reassignmentOptions={deleteConfirm ? getReassignmentOptions(deleteConfirm.categoryId) : []}
        onStateChange={setDeleteConfirm}
        onConfirm={handleConfirmDeleteWithReassignment}
      />

      <ConfirmDialog {...confirmProps} />
    </Dialog>
  );
}

