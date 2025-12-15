declare module "@tanstack/react-virtual" {
  export interface VirtualItem {
    key: number
    index: number
    start: number
    end: number
    size: number
  }

  export interface UseVirtualizerOptions<TScrollElement> {
    count: number
    getScrollElement: () => TScrollElement | null
    estimateSize: (index: number) => number
    overscan?: number
  }

  export interface Virtualizer<TScrollElement, TItemElement> {
    getVirtualItems: () => VirtualItem[]
    getTotalSize: () => number
  }

  export function useVirtualizer<
    TScrollElement extends Element | Window,
    TItemElement extends Element
  >(options: UseVirtualizerOptions<TScrollElement>): Virtualizer<TScrollElement, TItemElement>
}


