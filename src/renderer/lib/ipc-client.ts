import type { ApiType } from '../../preload/preload';
import type { IpcResponse } from '../../shared/types';

declare global {
  interface Window {
    api: ApiType;
  }
}

export class IpcClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpcClientError';
  }
}

export function toErrorMessage(error: unknown, fallbackMessage = 'Something went wrong'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallbackMessage;
}

export function unwrapIpcResponse<T>(response: IpcResponse<T>, fallbackMessage = 'Request failed'): T {
  if (!response.success) {
    throw new IpcClientError(response.error || fallbackMessage);
  }

  return response.data as T;
}

export async function callIpc<T>(request: Promise<IpcResponse<T>>, fallbackMessage = 'Request failed'): Promise<T> {
  const response = await request;
  return unwrapIpcResponse(response, fallbackMessage);
}

export const api = window.api;
