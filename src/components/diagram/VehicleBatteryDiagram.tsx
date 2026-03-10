import React from "react";
import { PiBatteryChargingBold } from "react-icons/pi";
import { getTemplate } from "../../config/vehicleTemplates";
import { DEFAULT_TEMPLATE_ID, normalizeMarker } from "../../utils/batteryMarkerResolver";

function resolveDiagramSrc({ diagramUrl, templateId }) {
  const selectedTemplate = getTemplate(templateId || DEFAULT_TEMPLATE_ID);
  const fallbackTemplate = getTemplate(DEFAULT_TEMPLATE_ID);

  return diagramUrl || selectedTemplate?.src || fallbackTemplate?.src || "";
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
}) {
  const src = resolveDiagramSrc({ diagramUrl, templateId });
  const markerValue = normalizeMarker(marker);

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
}) {
  const src = resolveDiagramSrc({ diagramUrl, templateId });
  const markerValue = normalizeMarker(value);
  const containerRef = React.useRef(null);
  const draggingRef = React.useRef(false);

  const updateFromClientPoint = (clientX, clientY) => {
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

  const onPointerDown = (event) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const onPointerUp = () => {
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
