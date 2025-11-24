import React, { useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import PageHeader from "../../components/shared/PageHeader";
import SectionCard from "../../components/shared/SectionCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import DiagramMetrics from "../../components/diagramManagement/DiagramMetrics";
import DiagramOverviewTable from "../../components/diagramManagement/DiagramOverviewTable";
import DiagramEntryModal from "../../components/diagramManagement/DiagramEntryModal";
import AssignBatteryMarkerModal from "../../components/diagramManagement/AssignBatteryMarkerModal";

const INITIAL_DIAGRAMS = [
  {
    id: 1,
    make: "Toyota",
    model: "Corolla",
    year: 2015,
    diagramStatus: "uploaded", // uploaded | missing
    markerStatus: "pending",   // set | pending | not-assigned
    lastUpdated: "Jan 1",
    markerPosition: { x: 50, y: 35 }, // percentage on the image
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2018,
    diagramStatus: "missing",
    markerStatus: "not-assigned",
    lastUpdated: "Feb 1",
    markerPosition: null,
  },
  {
    id: 3,
    make: "Ford",
    model: "Focus",
    year: 2020,
    diagramStatus: "uploaded",
    markerStatus: "set",
    lastUpdated: "Mar 1",
    markerPosition: { x: 48, y: 30 },
  },
  {
    id: 4,
    make: "Chevrolet",
    model: "Malibu",
    year: 2019,
    diagramStatus: "missing",
    markerStatus: "pending",
    lastUpdated: "Apr 1",
    markerPosition: null,
  },
  {
    id: 5,
    make: "Nissan",
    model: "Sentra",
    year: 2021,
    diagramStatus: "uploaded",
    markerStatus: "set",
    lastUpdated: "May 1",
    markerPosition: { x: 52, y: 38 },
  },
  {
    id: 6,
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    diagramStatus: "uploaded",
    markerStatus: "set",
    lastUpdated: "Jun 1",
    markerPosition: { x: 49, y: 34 },
  },
];

const METRICS = [
  {
    id: "totalDiagrams",
    title: "Total Diagrams",
    value: "2,100",
    deltaLabel: "32% vs Last Month",
    deltaType: "up",
  },
  {
    id: "pending",
    title: "Pending Diagrams",
    value: "120",
    deltaLabel: "10% vs Last Month",
    deltaType: "up",
  },
  {
    id: "updated",
    title: "Updated This Month",
    value: "80",
    deltaLabel: "32% vs Last Month",
    deltaType: "up",
  },
  {
    id: "missingMarkers",
    title: "Missing Markers",
    value: "130",
    deltaLabel: "20% vs Last Month",
    deltaType: "up",
  },
];

const DiagramManagementPage = () => {
  const [diagrams, setDiagrams] = useState(INITIAL_DIAGRAMS);

  const [entryModalState, setEntryModalState] = useState({
    open: false,
    mode: "add", // add | edit
    diagram: null,
  });

  const [markerModalState, setMarkerModalState] = useState({
    open: false,
    diagram: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    diagram: null,
  });

  // ---- modal open/close helpers ----
  const openAddModal = () =>
    setEntryModalState({ open: true, mode: "add", diagram: null });

  const openEditModal = (diagram) =>
    setEntryModalState({ open: true, mode: "edit", diagram });

  const closeEntryModal = () =>
    setEntryModalState({ open: false, mode: "add", diagram: null });

  const openMarkerModal = (diagram) =>
    setMarkerModalState({ open: true, diagram });

  const closeMarkerModal = () =>
    setMarkerModalState({ open: false, diagram: null });

  const openDeleteConfirm = (diagram) =>
    setConfirmState({ open: true, diagram });

  const closeDeleteConfirm = () =>
    setConfirmState({ open: false, diagram: null });

  // ---- actions ----
  const handleSaveDiagram = (values) => {
    if (entryModalState.mode === "add") {
      const newDiagram = {
        id: Date.now(),
        ...values,
        diagramStatus: "uploaded",
        markerStatus: "not-assigned",
        lastUpdated: "Today",
        markerPosition: null,
      };
      setDiagrams((prev) => [...prev, newDiagram]);
    } else if (entryModalState.mode === "edit" && entryModalState.diagram) {
      setDiagrams((prev) =>
        prev.map((d) =>
          d.id === entryModalState.diagram.id ? { ...d, ...values } : d
        )
      );
    }
    closeEntryModal();
  };

  const handleSaveMarker = (diagramId, markerPosition) => {
    setDiagrams((prev) =>
      prev.map((d) =>
        d.id === diagramId
          ? {
              ...d,
              markerPosition,
              markerStatus: "set",
            }
          : d
      )
    );
    closeMarkerModal();
  };

  const handleDeleteDiagram = () => {
    if (!confirmState.diagram) return;
    setDiagrams((prev) =>
      prev.filter((d) => d.id !== confirmState.diagram.id)
    );
    closeDeleteConfirm();
  };

  return (
    <>
      <PageContainer>
        {/* <PageHeader title="Car Database Management" /> */}

        {/* Metrics row */}
        <DiagramMetrics metrics={METRICS} />

        {/* Overview table */}
        <SectionCard title="Overview" className="mt-5">
          <DiagramOverviewTable
            diagrams={diagrams}
            onAddDiagram={openAddModal}
            onEditDiagram={openEditModal}
            onAssignMarker={openMarkerModal}
            onDeleteDiagram={openDeleteConfirm}
          />
        </SectionCard>
      </PageContainer>

      {/* Add / Edit diagram */}
      <DiagramEntryModal
        isOpen={entryModalState.open}
        mode={entryModalState.mode}
        initialValues={entryModalState.diagram}
        onClose={closeEntryModal}
        onSubmit={handleSaveDiagram}
      />

      {/* Assign marker */}
      <AssignBatteryMarkerModal
        isOpen={markerModalState.open}
        diagram={markerModalState.diagram}
        onClose={closeMarkerModal}
        onSave={handleSaveMarker}
      />

      {/* Delete diagram confirm */}
      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteDiagram}
        title="Delete Diagram"
        description="Are you sure you want to delete this diagram? This action cannot be undone and will remove the image and its assigned battery marker."
        confirmLabel="Delete Diagram"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default DiagramManagementPage;
