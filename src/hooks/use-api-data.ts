"use client";

import { useCallback, useState } from "react";

export function useApiData<T>(fetcher: () => Promise<T>, initialData: T) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError : new Error("Something went wrong while loading data."));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { data, loading, error, refetch };
}
