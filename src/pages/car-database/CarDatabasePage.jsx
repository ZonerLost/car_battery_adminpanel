import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import CarDatabaseMetrics from "../../components/carDatabase/CarDatabaseMetrics";
import CarCoverageByTypeChart from "../../components/carDatabase/CarCoverageByTypeChart";
import CarCoverageByMakeChart from "../../components/carDatabase/CarCoverageByMakeChart";
import CarOverviewTable from "../../components/carDatabase/CarOverviewTable";
import CarEntryModal from "../../components/carDatabase/CarEntryModal";

import {
  listCarEntries,
  createCarEntry,
  updateCarEntry,
  deleteCarEntry,
  setCarActive,
} from "../../api/CarDatabase/CarDatabase.helper";
import { getOverviewStats, subscribeOverviewStats } from "../../api/stats/overviewStats.helper";

const RANGE_ORDER = ["thisMonth", "last90", "all"];
const RANGE_LABELS = {
  thisMonth: "This Month",
  last90: "Last 90 Days",
  all: "All Time",
};

const toDate = (value) => {
  if (value?.toDate?.()) return value.toDate();
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const createdAtInRange = (entry, range) => {
  const created = toDate(entry?.createdAt);
  if (!created) return true; // include unknown timestamps

  const now = new Date();
  if (range === "thisMonth") {
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }
  if (range === "last90") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 90);
    return created >= cutoff;
  }
  return true; // all time
};

const CarDatabasePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeIndex, setRangeIndex] = useState(0);
  const [overviewStats, setOverviewStats] = useState({ pendingReports: 0 });

  const [entryModalState, setEntryModalState] = useState({
    open: false,
    mode: "add",
    car: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null, // activate | deactivate | delete
    car: null,
  });

  const timeRange = RANGE_ORDER[rangeIndex];
  const rangeLabel = RANGE_LABELS[timeRange];
  const cycleRange = () => setRangeIndex((i) => (i + 1) % RANGE_ORDER.length);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listCarEntries();
      setCars(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let unsubscribeReports;

    const fetchStats = async () => {
      try {
        const stats = await getOverviewStats();
        setOverviewStats((prev) => ({ ...prev, ...stats }));
      } catch (e) {
        console.error("[car-db] overview stats load failed", e);
      }
    };

    fetchStats();

    try {
      unsubscribeReports = subscribeOverviewStats(
        (stats) => setOverviewStats((prev) => ({ ...prev, ...stats })),
        (err) => console.error("[car-db] overview stats subscription failed", err)
      );
    } catch (e) {
      console.error("[car-db] subscribe overview stats failed", e);
    }

    return () => {
      if (typeof unsubscribeReports === "function") unsubscribeReports();
    };
  }, []);

  const openAddModal = () => setEntryModalState({ open: true, mode: "add", car: null });
  const openEditModal = (car) => setEntryModalState({ open: true, mode: "edit", car });
  const closeEntryModal = () => setEntryModalState({ open: false, mode: "add", car: null });

  const openConfirm = (type, car) => setConfirmState({ open: true, type, car });
  const closeConfirm = () => setConfirmState({ open: false, type: null, car: null });

  const handleSaveCar = async (values, files) => {
    try {
      if (entryModalState.mode === "add") {
        await createCarEntry(values, files);
      } else if (entryModalState.mode === "edit" && entryModalState.car?.id) {
        await updateCarEntry(entryModalState.car.id, values, files);
      }
      closeEntryModal();
      await load();
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
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const scopedCars = useMemo(
    () => cars.filter((c) => createdAtInRange(c, timeRange)),
    [cars, timeRange]
  );

  const metrics = useMemo(() => {
    const totalCars = scopedCars.length;
    const newCarsInRange = scopedCars.length;
    const diagramsUploaded = scopedCars.filter((c) => !!c.diagramUrl).length;
    const pendingReports = Number(overviewStats?.pendingReports ?? 0);

    return [
      { id: "totalCars", title: "Cars in Database", value: String(totalCars), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "newCars", title: "New Cars Added", value: String(newCarsInRange), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "diagrams", title: "Diagrams Uploaded", value: String(diagramsUploaded), deltaLabel: rangeLabel, deltaType: "neutral" },
      { id: "pendingReports", title: "Pending Reports", value: String(pendingReports), deltaLabel: rangeLabel, deltaType: "neutral" },
    ];
  }, [scopedCars, rangeLabel, overviewStats?.pendingReports]);

  const byTypeData = useMemo(() => {
    const map = new Map();
    scopedCars.forEach((c) => {
      const k = c.bodyType || "Other";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [scopedCars]);

  const byMakeData = useMemo(() => {
    const map = new Map();
    scopedCars.forEach((c) => {
      const k = c.make || "Unknown";
      map.set(k, (map.get(k) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([make, total]) => ({ make, total }));
  }, [scopedCars]);

  const confirmConfig = (() => {
    const { type, car } = confirmState;
    if (!type || !car) return null;

    if (type === "activate") {
      return {
        title: "Activate Car Entry",
        description:
          "This car entry will become visible in search results and accessible to users once activated. Make sure its diagram and marker are verified.",
        confirmLabel: "Activate",
        cancelLabel: "Cancel",
        variant: "primary",
      };
    }
    if (type === "deactivate") {
      return {
        title: "Deactivate Car Entry",
        description:
          "Are you sure you want to deactivate this car entry? It will no longer appear in search results in the mobile app.",
        confirmLabel: "Deactivate",
        cancelLabel: "Cancel",
        variant: "danger",
      };
    }
    return {
      title: "Delete Car Entry",
      description:
        "Are you sure you want to permanently delete this car entry? This action cannot be undone.",
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
            <CarCoverageByTypeChart data={byTypeData} />
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
            <CarCoverageByMakeChart data={byMakeData} />
          </ChartCard>
        </div>

        <SectionCard title="Overview" className="mt-5">
          <CarOverviewTable
            cars={cars}
            loading={loading}
            onAddCar={openAddModal}
            onEditCar={openEditModal}
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
