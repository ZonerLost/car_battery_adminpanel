import { useCallback, useEffect, useState } from "react";
import { listCarEntries } from "../api/shared/carEntries.helper";
import { listReports } from "../api/FeedbackReports/FeedbackReports.helper";

/**
 * Fetches dashboard-facing data sets from Firestore.
 * Returns cars (from carDatabase) and reports (from feedbackReports).
 * The hook is intentionally lightweight and exposes a refresh action
 * so pages can revalidate after mutations.
 */
export default function useDashboardData() {
  const [cars, setCars] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [carRows, reportResult] = await Promise.all([listCarEntries(), listReports()]);

      const normalizedReports = Array.isArray(reportResult)
        ? reportResult
        : Array.isArray(reportResult?.reports)
        ? reportResult.reports
        : Array.isArray(reportResult?.data)
        ? reportResult.data
        : [];

      setCars(carRows || []);
      setReports(normalizedReports);
    } catch (e) {
      console.error("[dashboard] load failed", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cars, reports, loading, error, refresh };
}
