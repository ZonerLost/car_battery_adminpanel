// import React from "react";
// import { getTemplate } from "../../config/vehicleTemplates";

// export type MarkerPct = {
//   xPct: number; // 0..100
//   yPct: number; // 0..100
// };

// function clamp(n: number, min: number, max: number) {
//   return Math.max(min, Math.min(max, n));
// }

// function toPctMarker(input: any): MarkerPct | null {
//   if (!input) return null;

//   // supports: {xPct,yPct} OR {x,y} normalized (0..1)
//   const hasPct = input.xPct !== undefined && input.yPct !== undefined;
//   if (hasPct) {
//     const x = clamp(Number(input.xPct), 0, 100);
//     const y = clamp(Number(input.yPct), 0, 100);
//     if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
//     return { xPct: x, yPct: y };
//   }

//   const hasNorm = input.x !== undefined && input.y !== undefined;
//   if (hasNorm) {
//     const x = clamp(Number(input.x) * 100, 0, 100);
//     const y = clamp(Number(input.y) * 100, 0, 100);
//     if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
//     return { xPct: x, yPct: y };
//   }

//   return null;
// }

// type BaseProps = {
//   /** If you uploaded a custom per-car diagram, pass diagramUrl. Otherwise it will use templateId. */
//   diagramUrl?: string | null;
//   templateId?: string | null;
//   marker?: any; // accepts MarkerPct or normalized
//   className?: string;
// };

// export function VehicleBatteryDiagram({
//   diagramUrl,
//   templateId,
//   marker,
//   className = "",
// }: BaseProps) {
//   const tpl = getTemplate(templateId);
//   const markerPct = toPctMarker(marker);

//   const src = diagramUrl || tpl.src;

//   return (
//     <div className={`relative w-full ${className}`}>
//       <img
//         src={src}
//         alt="Vehicle top view"
//         className="w-full h-auto block select-none pointer-events-none"
//         draggable={false}
//       />

//       {markerPct && (
//         <div
//           className="absolute"
//           style={{
//             left: `${markerPct.xPct}%`,
//             top: `${markerPct.yPct}%`,
//             transform: "translate(-50%, -50%)",
//           }}
//         >
//           {/* Marker UI (simple, consistent) */}
//           <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 shadow-lg border-2 border-white">
//             <span className="text-white text-lg leading-none">🔋</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// type PickerProps = {
//   diagramUrl?: string | null;
//   templateId?: string | null;
//   value?: MarkerPct | null;
//   onChange: (next: MarkerPct) => void;
//   className?: string;
// };

// export function VehicleBatteryDiagramPicker({
//   diagramUrl,
//   templateId,
//   value,
//   onChange,
//   className = "",
// }: PickerProps) {
//   const tpl = getTemplate(templateId);
//   const src = diagramUrl || tpl.src;

//   const containerRef = React.useRef<HTMLDivElement | null>(null);
//   const draggingRef = React.useRef(false);

//   const updateFromClientPoint = (clientX: number, clientY: number) => {
//     const el = containerRef.current;
//     if (!el) return;
//     const rect = el.getBoundingClientRect();

//     const x = ((clientX - rect.left) / rect.width) * 100;
//     const y = ((clientY - rect.top) / rect.height) * 100;

//     const next = {
//       xPct: clamp(Number(x.toFixed(2)), 0, 100),
//       yPct: clamp(Number(y.toFixed(2)), 0, 100),
//     };

//     onChange(next);
//   };

//   const onPointerDown = (e: React.PointerEvent) => {
//     draggingRef.current = true;
//     (e.currentTarget as any).setPointerCapture?.(e.pointerId);
//     updateFromClientPoint(e.clientX, e.clientY);
//   };

//   const onPointerMove = (e: React.PointerEvent) => {
//     if (!draggingRef.current) return;
//     updateFromClientPoint(e.clientX, e.clientY);
//   };

//   const onPointerUp = () => {
//     draggingRef.current = false;
//   };

//   return (
//     <div
//       ref={containerRef}
//       className={`relative w-full select-none ${className}`}
//       onPointerDown={onPointerDown}
//       onPointerMove={onPointerMove}
//       onPointerUp={onPointerUp}
//       onPointerCancel={onPointerUp}
//       style={{ touchAction: "none", cursor: "crosshair" }}
//     >
//       <img
//         src={src}
//         alt="Vehicle top view"
//         className="w-full h-auto block"
//         draggable={false}
//       />

//       {value && (
//         <div
//           className="absolute"
//           style={{
//             left: `${value.xPct}%`,
//             top: `${value.yPct}%`,
//             transform: "translate(-50%, -50%)",
//           }}
//         >
//           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 shadow-lg border-2 border-white">
//             <span className="text-white text-lg leading-none">🔋</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React from "react";
import { getTemplate } from "../../config/vehicleTemplates";
import {
  DEFAULT_TEMPLATE_ID,
  normalizeMarkerList,
} from "../../utils/batteryMarkerResolver";

function resolveDiagramSrc({ diagramUrl, templateId }) {
  const selected = getTemplate(templateId || DEFAULT_TEMPLATE_ID);
  const fallback = getTemplate(DEFAULT_TEMPLATE_ID);
  return diagramUrl || selected?.src || fallback?.src || "";
}

export function VehicleBatteryDiagram({
  diagramUrl,
  templateId,
  marker,
  markers,
  className = "",
  imageClassName = "",
  markerClassName = "",
  markerSizeClassName = "w-10 h-10",
  showPulse = true,
}) {
  const src = resolveDiagramSrc({ diagramUrl, templateId });
  const markerList = normalizeMarkerList(markers, marker);

  return (
    <div className={`relative w-full ${className}`}>
      <img
        src={src}
        alt="Vehicle top view"
        className={`block h-auto w-full select-none pointer-events-none ${imageClassName}`}
        draggable={false}
      />

      {markerList.map((item, index) => (
        <div
          key={`${index}-${item.xPct}-${item.yPct}`}
          className="absolute"
          style={{
            left: `${item.xPct}%`,
            top: `${item.yPct}%`,
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
              title={`Battery ${index + 1}`}
            >
              <span className="text-base leading-none">🔋</span>

              {markerList.length > 1 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold leading-none text-white">
                  {index + 1}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
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

      {value?.xPct != null && value?.yPct != null ? (
        <div
          className="absolute"
          style={{
            left: `${value.xPct}%`,
            top: `${value.yPct}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-red-500/35 animate-ping" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg">
              <span className="text-base leading-none">🔋</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}