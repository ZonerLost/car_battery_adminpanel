import React from "react";
import { PiBatteryChargingBold } from "react-icons/pi";
import { getTemplate } from "../../config/vehicleTemplates";
import { DEFAULT_TEMPLATE_ID, normalizeMarker } from "../../utils/batteryMarkerResolver";

type MarkerCoordinates = {
  xPct: number;
  yPct: number;
};

type MarkerInput =
  | MarkerCoordinates
  | {
      xPct?: number | null;
      yPct?: number | null;
      x?: number | null;
      y?: number | null;
    }
  | null
  | undefined;

type DiagramSourceProps = {
  diagramUrl?: string | null;
  templateId?: string | null;
};

type VehicleBatteryDiagramProps = DiagramSourceProps & {
  marker?: MarkerInput;
  className?: string;
  imageClassName?: string;
  markerClassName?: string;
  markerSizeClassName?: string;
  showPulse?: boolean;
};

type VehicleBatteryDiagramPickerProps = DiagramSourceProps & {
  value?: MarkerInput;
  onChange: (marker: MarkerCoordinates) => void;
  className?: string;
};

function resolveDiagramSrc({ diagramUrl, templateId }: DiagramSourceProps): string {
  const selectedTemplate = getTemplate(templateId || DEFAULT_TEMPLATE_ID);
  const fallbackTemplate = getTemplate(DEFAULT_TEMPLATE_ID);

  return diagramUrl || selectedTemplate?.src || fallbackTemplate?.src || "";
}

function toMarkerCoordinates(marker: MarkerInput): MarkerCoordinates | null {
  return normalizeMarker(marker) as MarkerCoordinates | null;
}

export function VehicleBatteryDiagram({
  diagramUrl,
  templateId,
  marker,
  className = "",
  imageClassName = "",
  markerClassName = "",
  markerSizeClassName = "w-10 h-10",
  showPulse = true,
}: VehicleBatteryDiagramProps) {
  const src = resolveDiagramSrc({ diagramUrl, templateId });
  const markerValue = toMarkerCoordinates(marker);

  return (
    <div className={`relative w-full ${className}`}>
      <img
        src={src}
        alt="Vehicle top view"
        className={`block h-auto w-full select-none pointer-events-none ${imageClassName}`}
        draggable={false}
      />

      {markerValue ? (
        <div
          className="absolute"
          style={{
            left: `${markerValue.xPct}%`,
            top: `${markerValue.yPct}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            {showPulse ? (
              <span className="absolute inset-0 rounded-full bg-red-500/35 animate-ping" />
            ) : null}

            <div
              className={[
                "relative flex items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg",
                markerSizeClassName,
                markerClassName,
              ].join(" ")}
              title="Battery location"
            >
              <PiBatteryChargingBold className="text-base" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VehicleBatteryDiagramPicker({
  diagramUrl,
  templateId,
  value,
  onChange,
  className = "",
}: VehicleBatteryDiagramPickerProps) {
  const src = resolveDiagramSrc({ diagramUrl, templateId });
  const markerValue = toMarkerCoordinates(value);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);

  const updateFromClientPoint = (clientX: number, clientY: number): void => {
    const element = containerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;

    onChange({
      xPct: Math.max(0, Math.min(100, Number(xPct.toFixed(2)))),
      yPct: Math.max(0, Math.min(100, Number(yPct.toFixed(2)))),
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) return;
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const onPointerUp = (): void => {
    draggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none", cursor: "crosshair" }}
    >
      <img
        src={src}
        alt="Vehicle top view"
        className="block h-auto w-full"
        draggable={false}
      />

      {markerValue ? (
        <div
          className="absolute"
          style={{
            left: `${markerValue.xPct}%`,
            top: `${markerValue.yPct}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-red-500/35 animate-ping" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg">
              <PiBatteryChargingBold className="text-base" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
