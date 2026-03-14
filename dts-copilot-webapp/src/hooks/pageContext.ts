// Lightweight page context for analytics-webapp (no Zustand dependency)

export interface PageContext {
  module: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  extras?: Record<string, string>;
}

let _current: PageContext | null = null;

const PAGE_CONTEXT_EVENT = "dts:page-context-change";

export function setPageContext(ctx: PageContext): void {
  _current = ctx;
  window.dispatchEvent(new CustomEvent(PAGE_CONTEXT_EVENT, { detail: ctx }));
}

export function clearPageContext(): void {
  _current = null;
  window.dispatchEvent(new CustomEvent(PAGE_CONTEXT_EVENT, { detail: null }));
}

export function getPageContext(): PageContext | null {
  return _current;
}
