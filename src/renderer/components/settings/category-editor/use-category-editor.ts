import { useState, useEffect, useRef } from 'react';
import { CATEGORY_COLOURS } from '../../../../shared/constants';
import { callIpc, toErrorMessage } from '../../../lib/ipc-client';
import type { CategoryHierarchy, DbCategoryHeader, DbCategory, CategoryHeaderType } from '../../../../shared/types';

export function useCategoryEditor(accountId: string, open: boolean) {
  const [hierarchies, setHierarchies] = useState<CategoryHierarchy[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadData(showLoading = false) {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const nextHierarchies = await callIpc<CategoryHierarchy[]>(
        window.api.categoryHeaders.findHierarchical(accountId),
        'Failed to load categories',
      );

      setHierarchies(nextHierarchies ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to load categories'));
    } finally {
      if (showLoading) {
        setLoading(false);
      }

      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollTop;
        }
      });
    }
  }

  useEffect(() => {
    if (open && accountId) {
      loadData(true);
    }
  }, [open, accountId]);

  function getHierarchiesForType(type: CategoryHeaderType): CategoryHierarchy[] {
    return hierarchies.filter((hierarchy) => hierarchy.header.type === type);
  }

  async function handleCreateHeader(type: CategoryHeaderType, name: string) {
    try {
      await callIpc(
        window.api.categoryHeaders.create({
          name,
          type,
          colour: CATEGORY_COLOURS[Math.floor(Math.random() * CATEGORY_COLOURS.length)],
          account_id: accountId,
        }),
        'Failed to create header',
      );
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to create header'));
    }
  }

  async function handleUpdateHeader(id: string, data: Partial<DbCategoryHeader>) {
    try {
      await callIpc(window.api.categoryHeaders.update(id, data), 'Failed to update header');
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to update header'));
    }
  }

  async function handleDeleteHeader(id: string) {
    try {
      await callIpc(window.api.categoryHeaders.delete(id), 'Failed to delete header');
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to delete header'));
    }
  }

  async function handleCreateCategory(headerId: string, name: string) {
    try {
      await callIpc(
        window.api.categories.create({ name, category_header_id: headerId }),
        'Failed to create category',
      );
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to create category'));
    }
  }

  async function handleUpdateCategory(id: string, data: Partial<DbCategory>) {
    try {
      await callIpc(window.api.categories.update(id, data), 'Failed to update category');
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to update category'));
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await callIpc(window.api.categories.delete(id), 'Failed to delete category');
      await loadData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to delete category'));
    }
  }

  return {
    hierarchies,
    loading,
    errorMessage,
    scrollRef,
    loadData,
    getHierarchiesForType,
    handleCreateHeader,
    handleUpdateHeader,
    handleDeleteHeader,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
  };
}
