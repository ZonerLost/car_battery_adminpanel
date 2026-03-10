import React, { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import DiagramMetrics from "../../components/diagramManagement/DiagramMetrics";
import DiagramOverviewTable from "../../components/diagramManagement/DiagramOverviewTable";
import DiagramEntryModal from "../../components/diagramManagement/DiagramEntryModal";
import AssignBatteryMarkerModal from "../../components/diagramManagement/AssignBatteryMarkerModal";
import toast from "react-hot-toast";

import {
  listCarEntries,
  createCarEntry,
  updateCarEntry,
  deleteCarEntry,
  saveMarker,
} from "../../api/DiagramManagement/DiagramManagement.helper";
import useAsyncAction from "../../hooks/useAsyncAction";
import { getErrorMessage } from "../../utils/errorMessage";

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
  const [entrySubmitError, setEntrySubmitError] = useState("");
  const [markerSubmitError, setMarkerSubmitError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const { run, isPending } = useAsyncAction();
  const entryActionKey =
    entryModalState.mode === "edit" && entryModalState.diagram?.id
      ? `diagram-entry:update:${entryModalState.diagram.id}`
      : "diagram-entry:create";
  const markerActionKey = markerModalState.diagram?.id
    ? `diagram-marker:${markerModalState.diagram.id}`
    : "diagram-marker";
  const deleteActionKey = confirmState.diagram?.id
    ? `diagram-delete:${confirmState.diagram.id}`
    : null;

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

  const openAddModal = () => {
    setEntrySubmitError("");
    setEntryModalState({ open: true, mode: "add", diagram: null });
  };
  const openEditModal = (diagram) => {
    setEntrySubmitError("");
    setEntryModalState({ open: true, mode: "edit", diagram });
  };
  const closeEntryModal = () => {
    if (isPending(entryActionKey)) return;
    setEntrySubmitError("");
    setEntryModalState({ open: false, mode: "add", diagram: null });
  };

  const openMarkerModal = (diagram) => {
    setMarkerSubmitError("");
    setMarkerModalState({ open: true, diagram });
  };
  const closeMarkerModal = () => {
    if (isPending(markerActionKey)) return;
    setMarkerSubmitError("");
    setMarkerModalState({ open: false, diagram: null });
  };

  const openDeleteConfirm = (diagram) => {
    setDeleteError("");
    setConfirmState({ open: true, diagram });
  };
  const closeDeleteConfirm = () => {
    if (isPending(deleteActionKey)) return;
    setDeleteError("");
    setConfirmState({ open: false, diagram: null });
  };

  const handleSaveDiagram = async (values, files) => {
    if (isPending(entryActionKey)) return;

    setEntrySubmitError("");

    const isEdit = entryModalState.mode === "edit" && entryModalState.diagram?.id;
    const hasDiagramUpload = Boolean(files?.diagramFile);
    const successMessage = isEdit
      ? hasDiagramUpload
        ? "Diagram updated successfully"
        : "Car updated successfully"
      : "Car added successfully";
    const fallbackError = isEdit
      ? hasDiagramUpload
        ? "Failed to update diagram"
        : "Failed to update car"
      : "Failed to add car";

    const result = await run(entryActionKey, async () => {
      if (!isEdit) {
        await createCarEntry(values, files);
        return;
      }

      await updateCarEntry(entryModalState.diagram.id, values, files);
    });

    if (result.skipped) return;

    if (!result.ok) {
      const message = getErrorMessage(result.error, fallbackError);
      setEntrySubmitError(message);
      toast.error(message, { id: "diagram-entry-submit" });
      return;
    }

    closeEntryModal();
    toast.success(successMessage, { id: "diagram-entry-submit" });
    await load();
  };

  const handleSaveMarker = async (diagramId, markerPosition) => {
    const actionKey = `diagram-marker:${diagramId}`;
    if (isPending(actionKey)) return;

    setMarkerSubmitError("");

    const result = await run(actionKey, async () => {
      await saveMarker(diagramId, markerPosition);
    });

    if (result.skipped) return;

    if (!result.ok) {
      const message = getErrorMessage(result.error, "Failed to save marker");
      setMarkerSubmitError(message);
      toast.error(message, { id: "diagram-marker-save" });
      return;
    }

    closeMarkerModal();
    toast.success("Battery marker saved successfully", { id: "diagram-marker-save" });
    await load();
  };

  const handleDeleteDiagram = async () => {
    if (!confirmState.diagram?.id) return;
    if (isPending(deleteActionKey)) return;

    setDeleteError("");

    const result = await run(deleteActionKey, async () => {
      await deleteCarEntry(confirmState.diagram.id);
    });

    if (result.skipped) return;

    if (!result.ok) {
      const message = getErrorMessage(result.error, "Failed to delete car");
      setDeleteError(message);
      toast.error(message, { id: "diagram-delete" });
      return;
    }

    closeDeleteConfirm();
    toast.success("Car deleted successfully", { id: "diagram-delete" });
    await load();
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
            pendingDeleteId={isPending(deleteActionKey) ? confirmState.diagram?.id : null}
          />
        </SectionCard>
      </PageContainer>

      <DiagramEntryModal
        isOpen={entryModalState.open}
        mode={entryModalState.mode}
        initialValues={entryModalState.diagram}
        onClose={closeEntryModal}
        onSubmit={handleSaveDiagram}
        isSubmitting={isPending(entryActionKey)}
        submitError={entrySubmitError}
      />

      <AssignBatteryMarkerModal
        isOpen={markerModalState.open}
        diagram={markerModalState.diagram}
        onClose={closeMarkerModal}
        onSave={handleSaveMarker}
        isSaving={isPending(markerActionKey)}
        saveError={markerSubmitError}
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
        loading={isPending(deleteActionKey)}
        loadingLabel="Deleting..."
        errorText={deleteError}
      />
    </>
  );
};

export default DiagramManagementPage;
