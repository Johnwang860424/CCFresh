"use client";

import { useEffect, useState } from "react";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 載入單一唯讀 API 資源的小工具：統一處理 loading / error 與 unmount 競態。
 * errorMessage 同時用於 console 與回傳給 UI 顯示的訊息。
 */
export function useResource<T>(
  url: string,
  errorMessage: string,
): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const data = (await res.json()) as T;
        if (isMounted) setState({ data, loading: false, error: null });
      } catch (e) {
        console.error(errorMessage, e);
        if (isMounted) {
          setState({ data: null, loading: false, error: errorMessage });
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [url, errorMessage]);

  return state;
}
