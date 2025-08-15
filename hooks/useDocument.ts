import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";

interface Options {
  collectionName: string;
  documentId: string;
  autoFetch?: boolean;
}

export const useDocument = <T>({
  collectionName,
  documentId,
  autoFetch = true,
}: Options) => {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (override?: { collectionName?: string; documentId?: string }) => {
      const col = override?.collectionName ?? collectionName;
      const id = override?.documentId ?? documentId;
      if (!col || !id) return;

      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, col, id));
        setData(snap.exists() ? { ...(snap.data() as T), id: snap.id } : null);
        if (!snap.exists()) setError("Document not found");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching document"
        );
      } finally {
        setLoading(false);
      }
    },
    [collectionName, documentId]
  );

  useEffect(() => {
    if (autoFetch && documentId) fetchData();
  }, [autoFetch, documentId, fetchData]);

  return { document: data, loading, error, fetchData };
};
