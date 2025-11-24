import React, { useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import PageHeader from "../../components/shared/PageHeader";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import CarDatabaseMetrics from "../../components/carDatabase/CarDatabaseMetrics";
import CarCoverageByTypeChart from "../../components/carDatabase/CarCoverageByTypeChart";
import CarCoverageByMakeChart from "../../components/carDatabase/CarCoverageByMakeChart";
import CarOverviewTable from "../../components/carDatabase/CarOverviewTable";
import CarEntryModal from "../../components/carDatabase/CarEntryModal";

const INITIAL_CARS = [
  {
    id: 1,
    make: "Toyota",
    model: "Corolla",
    year: 2015,
    role: "Engine Bay (Right)",
    reportsPending: 3,
    status: "active",
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2018,
    role: "Engine Bay (Left)",
    reportsPending: 1,
    status: "active",
  },
  {
    id: 3,
    make: "Ford",
    model: "Focus",
    year: 2020,
    role: "Trunk",
    reportsPending: 0,
    status: "inactive",
  },
  {
    id: 4,
    make: "Chevrolet",
    model: "Malibu",
    year: 2019,
    role: "Interior (Front)",
    reportsPending: 2,
    status: "active",
  },
  {
    id: 5,
    make: "Nissan",
    model: "Sentra",
    year: 2021,
    role: "Engine Bay (Center)",
    reportsPending: 0,
    status: "active",
  },
  {
    id: 6,
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    role: "Trunk",
    reportsPending: 0,
    status: "active",
  },
];

const METRICS = [
  {
    id: "totalCars",
    title: "Total Cars in Database",
    value: "2,450",
    deltaLabel: "10% vs Last Month",
    deltaType: "up",
  },
  {
    id: "newCars",
    title: "New Cars Added",
    value: "120",
    deltaLabel: "10% vs Last Month",
    deltaType: "up",
  },
  {
    id: "diagrams",
    title: "Diagrams Uploaded",
    value: "2,100",
    deltaLabel: "32% vs Last Month",
    deltaType: "up",
  },
  {
    id: "pendingReports",
    title: "Pending Reports",
    value: "85",
    deltaLabel: "20% vs Last Month",
    deltaType: "up",
  },
];

const CarDatabasePage = () => {
  const [cars, setCars] = useState(INITIAL_CARS);

  const [entryModalState, setEntryModalState] = useState({
    open: false,
    mode: "add", // "add" | "edit"
    car: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null, // "activate" | "deactivate" | "delete"
    car: null,
  });

  const openAddModal = () =>
    setEntryModalState({ open: true, mode: "add", car: null });

  const openEditModal = (car) =>
    setEntryModalState({ open: true, mode: "edit", car });

  const closeEntryModal = () =>
    setEntryModalState({ open: false, mode: "add", car: null });

  const openConfirm = (type, car) =>
    setConfirmState({ open: true, type, car });

  const closeConfirm = () =>
    setConfirmState({ open: false, type: null, car: null });

  const handleSaveCar = (values) => {
    if (entryModalState.mode === "add") {
      const newCar = {
        id: Date.now(),
        ...values,
      };
      setCars((prev) => [...prev, newCar]);
    } else if (entryModalState.mode === "edit" && entryModalState.car) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === entryModalState.car.id ? { ...c, ...values } : c
        )
      );
    }
    closeEntryModal();
  };

  const handleConfirmAction = () => {
    const { type, car } = confirmState;
    if (!car) return;

    if (type === "delete") {
      setCars((prev) => prev.filter((c) => c.id !== car.id));
    } else if (type === "activate") {
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id ? { ...c, status: "active" } : c
        )
      );
    } else if (type === "deactivate") {
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id ? { ...c, status: "inactive" } : c
        )
      );
    }

    closeConfirm();
  };

  const confirmConfig = (() => {
    const { type, car } = confirmState;
    if (!type || !car) return null;

    if (type === "activate") {
      return {
        title: "Activate Car Entry",
        description:
          "This car entry will become visible in search results and accessible to users once activated. Make sure its battery diagram and details are verified.",
        confirmLabel: "Activate",
        cancelLabel: "Cancel",
        variant: "primary",
      };
    }
    if (type === "deactivate") {
      return {
        title: "Deactivate Car Entry",
        description:
          "Are you sure you want to deactivate this car entry? It will no longer appear in search results or be visible to users in the mobile app.",
        confirmLabel: "Deactivate",
        cancelLabel: "Cancel",
        variant: "danger",
      };
    }
    return {
      title: "Delete Car Entry",
      description:
        "Are you sure you want to permanently delete this car entry? This action cannot be undone and will also remove all linked diagrams, feedback, and reports related to this car.",
      confirmLabel: "Delete Car",
      cancelLabel: "Cancel",
      variant: "danger",
    };
  })();

  return (
    <>
      <PageContainer>
        {/* <PageHeader title="Car Database Management" /> */}

        {/* Metrics */}
        <CarDatabaseMetrics metrics={METRICS} />

        {/* Charts */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Car Coverage By Type"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Month
              </button>
            }
          >
            <CarCoverageByTypeChart />
          </ChartCard>

          <ChartCard
            title="Car Coverage By Make"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Month
              </button>
            }
          >
            <CarCoverageByMakeChart />
          </ChartCard>
        </div>

        {/* Overview */}
        <SectionCard title="Overview" className="mt-5">
          <CarOverviewTable
            cars={cars}
            onAddCar={openAddModal}
            onEditCar={openEditModal}
            onToggleStatus={(car) =>
              openConfirm(car.status === "active" ? "deactivate" : "activate", car)
            }
            onDeleteCar={(car) => openConfirm("delete", car)}
          />
        </SectionCard>
      </PageContainer>

      {/* Add / Edit Car Entry */}
      <CarEntryModal
        isOpen={entryModalState.open}
        mode={entryModalState.mode}
        initialValues={entryModalState.car}
        onClose={closeEntryModal}
        onSubmit={handleSaveCar}
      />

      {/* Activate / Deactivate / Delete dialogs */}
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
