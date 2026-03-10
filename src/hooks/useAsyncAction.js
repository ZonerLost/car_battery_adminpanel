import { useCallback, useMemo, useRef, useState } from "react";

const removeKey = (source, key) => {
  if (!source[key]) return source;
  const next = { ...source };
  delete next[key];
  return next;
};

const useAsyncAction = () => {
  const locksRef = useRef(new Set());
  const [pendingMap, setPendingMap] = useState({});

  const start = useCallback((key) => {
    if (!key || locksRef.current.has(key)) return false;
    locksRef.current.add(key);
    setPendingMap((prev) => ({ ...prev, [key]: true }));
    return true;
  }, []);

  const finish = useCallback((key) => {
    if (!key) return;
    locksRef.current.delete(key);
    setPendingMap((prev) => removeKey(prev, key));
  }, []);

  const run = useCallback(
    async (key, action) => {
      if (!start(key)) {
        return { ok: false, skipped: true };
      }

      try {
        const result = await action();
        return { ok: true, result, skipped: false };
      } catch (error) {
        return { ok: false, error, skipped: false };
      } finally {
        finish(key);
      }
    },
    [finish, start]
  );

  const isPending = useCallback((key) => Boolean(key && pendingMap[key]), [pendingMap]);
  const pendingKeys = useMemo(() => Object.keys(pendingMap), [pendingMap]);

  return {
    run,
    isPending,
    hasPending: pendingKeys.length > 0,
    pendingKeys,
  };
};

export default useAsyncAction;
