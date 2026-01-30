import React, { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import DiagramMetrics from "../../components/diagramManagement/DiagramMetrics";
import DiagramOverviewTable from "../../components/diagramManagement/DiagramOverviewTable";
import DiagramEntryModal from "../../components/diagramManagement/DiagramEntryModal";
import AssignBatteryMarkerModal from "../../components/diagramManagement/AssignBatteryMarkerModal";

import {
  listCarEntries,
  createCarEntry,
  updateCarEntry,
  deleteCarEntry,
  saveMarker,
} from "../../api/DiagramManagement/DiagramManagement.helper";

const DiagramManagementPage = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [entryModalState, setEntryModalState] = useState({
    open: false,
    mode: "add",
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

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listCarEntries();
      setDiagrams(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAddModal = () => setEntryModalState({ open: true, mode: "add", diagram: null });
  const openEditModal = (diagram) => setEntryModalState({ open: true, mode: "edit", diagram });
  const closeEntryModal = () => setEntryModalState({ open: false, mode: "add", diagram: null });

  const openMarkerModal = (diagram) => setMarkerModalState({ open: true, diagram });
  const closeMarkerModal = () => setMarkerModalState({ open: false, diagram: null });

  const openDeleteConfirm = (diagram) => setConfirmState({ open: true, diagram });
  const closeDeleteConfirm = () => setConfirmState({ open: false, diagram: null });

  const handleSaveDiagram = async (values, files) => {
    try {
      if (entryModalState.mode === "add") {
        await createCarEntry(values, files);
      } else if (entryModalState.mode === "edit" && entryModalState.diagram?.id) {
        await updateCarEntry(entryModalState.diagram.id, values, files);
      }
      closeEntryModal();
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMarker = async (diagramId, markerPosition) => {
    try {
      await saveMarker(diagramId, markerPosition);
      closeMarkerModal();
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDiagram = async () => {
    if (!confirmState.diagram?.id) return;
    try {
      await deleteCarEntry(confirmState.diagram.id);
      closeDeleteConfirm();
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const metrics = useMemo(() => {
    const totalDiagrams = diagrams.length;
    const uploaded = diagrams.filter((d) => !!d.diagramUrl).length;
    const missing = diagrams.filter((d) => !d.diagramUrl).length;

    return [
      { id: "totalDiagrams", title: "Total Diagrams", value: String(totalDiagrams), deltaLabel: null, deltaType: "neutral" },
      { id: "pending", title: "Pending Diagrams", value: String(missing), deltaLabel: null, deltaType: "neutral" },
      { id: "updated", title: "Uploaded Diagrams", value: String(uploaded), deltaLabel: null, deltaType: "neutral" },
    ];
  }, [diagrams]);

  return (
    <>
      <PageContainer>
        <DiagramMetrics metrics={metrics} />

        <SectionCard title="Overview" className="mt-5">
          <DiagramOverviewTable
            diagrams={diagrams}
            loading={loading}
            onAddDiagram={openAddModal}
            onEditDiagram={openEditModal}
            onAssignMarker={openMarkerModal}
            onDeleteDiagram={openDeleteConfirm}
          />
        </SectionCard>
      </PageContainer>

      <DiagramEntryModal
        isOpen={entryModalState.open}
        mode={entryModalState.mode}
        initialValues={entryModalState.diagram}
        onClose={closeEntryModal}
        onSubmit={handleSaveDiagram}
      />

      <AssignBatteryMarkerModal
        isOpen={markerModalState.open}
        diagram={markerModalState.diagram}
        onClose={closeMarkerModal}
        onSave={handleSaveMarker}
      />

      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteDiagram}
        title="Delete Diagram"
        description="Are you sure you want to delete this diagram? This action cannot be undone."
        confirmLabel="Delete Diagram"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default DiagramManagementPage;
