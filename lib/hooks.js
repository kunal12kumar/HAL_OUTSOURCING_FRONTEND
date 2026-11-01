"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Loads data on mount and whenever `key` changes. `reload()` fetches again without clearing the screen.
export function useLoad(loader, key = "") {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async (silent) => {
    if (!silent) setState((s) => ({ ...s, loading: true }));
    try {
      const data = await loaderRef.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ data: silent ? s.data : null, error, loading: false }));
    }
  }, []);

  useEffect(() => {
    run(false);
  }, [run, key]);

  return { ...state, reload: () => run(true) };
}
