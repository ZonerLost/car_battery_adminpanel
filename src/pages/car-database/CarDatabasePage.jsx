import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import CarDatabaseMetrics from "../../components/carDatabase/CarDatabaseMetrics";
import CarCoverageByTypeChart from "../../components/carDatabase/CarCoverageByTypeChart";
import CarCoverageByMakeChart from "../../components/carDatabase/CarCoverageByMakeChart";
import CarOverviewTable from "../../components/carDatabase/CarOverviewTable";
import CarEntryModal from "../../components/carDatabase/CarEntryModal";
import AssignBatteryMarkerModal from "../../components/diagramManagement/AssignBatteryMarkerModal";

import {
  fetchCarsPage,
  getCarEntry,
  createCarEntry,
  updateCarEntry,
  deleteCarEntry,
  setCarActive,
  saveMarker,
} from "../../api/CarDatabase/CarDatabase.helper";
import { getOverviewStats, subscribeOverviewStats } from "../../api/stats/overviewStats.helper";
import { getCarDatabaseCounts } from "../../api/stats/carDatabaseCounts.helper";

const RANGE_ORDER = ["thisMonth", "last90", "all"];
const RANGE_LABELS = { thisMonth: "This Month", last90: "Last 90 Days", all: "All Time" };

const normalizeYearInput = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = typeof value === "string" ? value.trim() : value;
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

const CarDatabasePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const cursorStackRef = useRef([]); // index = page-1 stores lastDoc of that page

  const [filters, setFilters] = useState({
    pageSize: 25,
    status: "all",
    make: "",
    yearFrom: "",
    yearTo: "",
    search: "",
  });

  // ---------- Dashboard stats ----------
  const [rangeIndex, setRangeIndex] = useState(0);
  const timeRange = RANGE_ORDER[rangeIndex];
  const rangeLabel = RANGE_LABELS[timeRange];
  const cycleRange = () => setRangeIndex((i) => (i + 1) % RANGE_ORDER.length);

  const [counts, setCounts] = useState({ totalCars: 0, newCars: 0, diagramsUploaded: 0 });
  const [coverageByTypeData, setCoverageByTypeData] = useState([]);
  const [coverageByMakeData, setCoverageByMakeData] = useState([]);
  const [overviewStats, setOverviewStats] = useState({ pendingReports: 0 });

  // ---------- Modals ----------
  const [entryModalState, setEntryModalState] = useState({ open: false, mode: "add", car: null });
  const [markerModalState, setMarkerModalState] = useState({ open: false, car: null });
  const [confirmState, setConfirmState] = useState({ open: false, type: null, car: null });

  const openAddModal = () => setEntryModalState({ open: true, mode: "add", car: null });
  const openEditModal = (car) => setEntryModalState({ open: true, mode: "edit", car });
  const closeEntryModal = () => setEntryModalState({ open: false, mode: "add", car: null });

  const openMarkerModal = (car) => setMarkerModalState({ open: true, car });
  const closeMarkerModal = () => setMarkerModalState({ open: false, car: null });

  const openConfirm = (type, car) => setConfirmState({ open: true, type, car });
  const closeConfirm = () => setConfirmState({ open: false, type: null, car: null });

  const handleFilterChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    cursorStackRef.current = [];
    setPage(1);
  }, []);

  const loadPage = useCallback(
    async (targetPage) => {
      if (targetPage < 1) return;
      const startCursor = targetPage === 1 ? null : cursorStackRef.current[targetPage - 2] || null;
      const isInitial = targetPage === 1;

      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetchCarsPage({
          pageSize: filters.pageSize,
          cursor: startCursor,
          filters: {
            status: filters.status,
            make: filters.make,
            yearFrom: normalizeYearInput(filters.yearFrom),
            yearTo: normalizeYearInput(filters.yearTo),
            search: filters.search,
          },
        });

        setRows(res.rows || []);
        setHasMore(res.hasMore);
        cursorStackRef.current[targetPage - 1] = res.nextCursor || null;
        setPage(targetPage);
      } catch (e) {
        const msg =
          e?.code === "failed-precondition"
            ? "Firestore index required. Please create the suggested index from the console link."
            : "Failed to load cars.";
        toast.error(msg);
        console.error("[car-db] load page failed", e);
        if (isInitial) {
          setRows([]);
          setHasMore(false);
        }
      } finally {
        if (isInitial) setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const handleNextPage = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    loadPage(page + 1);
  }, [hasMore, loadPage, loading, loadingMore, page]);

  const handlePrevPage = useCallback(() => {
    if (page <= 1 || loading) return;
    loadPage(page - 1);
  }, [loadPage, loading, page]);

  // Dashboard: counts (scalable)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getCarDatabaseCounts(timeRange);
        if (!alive) return;
        setCounts(res.counts);
        setCoverageByTypeData(res.byTypeData || []);
        setCoverageByMakeData(res.byMakeData || []);
      } catch (e) {
        console.error("[car-db] counts failed", e);
        if (!alive) return;
        setCounts({ totalCars: 0, newCars: 0, diagramsUploaded: 0 });
        setCoverageByTypeData([]);
        setCoverageByMakeData([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [timeRange]);

  // Pending reports stats (existing helper)
  useEffect(() => {
    let unsubscribe;
    (async () => {
      try {
        const stats = await getOverviewStats();
        setOverviewStats((prev) => ({ ...prev, ...stats }));
      } catch (e) {
        console.error("[car-db] overview stats load failed", e);
      }
    })();

    try {
      unsubscribe = subscribeOverviewStats(
        (stats) => setOverviewStats((prev) => ({ ...prev, ...stats })),
        (err) => console.error("[car-db] overview stats subscription failed", err)
      );
    } catch (e) {
      console.error("[car-db] subscribe overview stats failed", e);
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const metrics = useMemo(() => {
    const pendingReports = Number(overviewStats?.pendingReports ?? 0);
    return [
      { id: "totalCars", title: "Cars in Database", value: String(counts.totalCars), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "newCars", title: "New Cars Added", value: String(counts.newCars), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "diagrams", title: "Diagrams Uploaded", value: String(counts.diagramsUploaded), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "pendingReports", title: "Pending Reports", value: String(pendingReports), deltaLabel: rangeLabel, deltaType: "neutral" },
    ];
  }, [counts, overviewStats?.pendingReports, rangeLabel]);

  const handleSaveCar = async (values, files) => {
    try {
      if (entryModalState.mode === "add") {
        const carId = await createCarEntry(values, files);
        closeEntryModal();

        // after creating, open marker modal to set location
        const created = await getCarEntry(carId);
        if (created) openMarkerModal(created);

        await loadPage(1);
      } else if (entryModalState.mode === "edit" && entryModalState.car?.id) {
        await updateCarEntry(entryModalState.car.id, values, files);
        closeEntryModal();
        await loadPage(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMarker = async (carId, markerPosition) => {
    try {
      await saveMarker(carId, markerPosition);
      closeMarkerModal();
      await loadPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmAction = async () => {
    const { type, car } = confirmState;
    if (!car?.id) return;

    try {
      if (type === "delete") {
        await deleteCarEntry(car.id);
      } else if (type === "activate") {
        await setCarActive(car.id, true);
      } else if (type === "deactivate") {
        await setCarActive(car.id, false);
      }

      closeConfirm();
      await loadPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmConfig = (() => {
    const { type, car } = confirmState;
    if (!type || !car) return null;

    if (type === "activate") {
      return {
        title: "Activate Car Entry",
        description: "This car entry will become visible in search results. Make sure its marker is verified.",
        confirmLabel: "Activate",
        cancelLabel: "Cancel",
        variant: "primary",
      };
    }
    if (type === "deactivate") {
      return {
        title: "Deactivate Car Entry",
        description:
          "Are you sure you want to deactivate this car entry? It will no longer appear in search results.",
        confirmLabel: "Deactivate",
        cancelLabel: "Cancel",
        variant: "danger",
      };
    }
    return {
      title: "Delete Car Entry",
      description: "Are you sure you want to permanently delete this car entry? This action cannot be undone.",
      confirmLabel: "Delete Car",
      cancelLabel: "Cancel",
      variant: "danger",
    };
  })();

  return (
    <>
      <PageContainer>
        <CarDatabaseMetrics metrics={metrics} />

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Car Coverage By Type"
            rightSlot={
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
                onClick={cycleRange}
              >
                {rangeLabel}
              </button>
            }
          >
            <CarCoverageByTypeChart data={coverageByTypeData} />
          </ChartCard>

          <ChartCard
            title="Car Coverage By Make"
            rightSlot={
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
                onClick={cycleRange}
              >
                {rangeLabel}
              </button>
            }
          >
            <CarCoverageByMakeChart data={coverageByMakeData} />
          </ChartCard>
        </div>

        <SectionCard title="Overview" className="mt-5">
          <CarOverviewTable
            rows={rows}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            page={page}
            filters={filters}
            onFilterChange={handleFilterChange}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onAddCar={openAddModal}
            onEditCar={openEditModal}
            onAssignMarker={openMarkerModal}
            onToggleStatus={(car) => openConfirm(car.status === "active" ? "deactivate" : "activate", car)}
            onDeleteCar={(car) => openConfirm("delete", car)}
          />
        </SectionCard>
      </PageContainer>

      <CarEntryModal
        isOpen={entryModalState.open}
        mode={entryModalState.mode}
        initialValues={entryModalState.car}
        onClose={closeEntryModal}
        onSubmit={handleSaveCar}
      />

      <AssignBatteryMarkerModal
        isOpen={markerModalState.open}
        diagram={markerModalState.car}
        onClose={closeMarkerModal}
        onSave={handleSaveMarker}
      />

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmState.open}
          onClose={closeConfirm}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel={confirmConfig.cancelLabel}
          variant={confirmConfig.variant}
        />
      )}
    </>
  );
};

export default CarDatabasePage;
