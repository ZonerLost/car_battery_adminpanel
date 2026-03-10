/* eslint-disable react-hooks/set-state-in-effect */
// /* eslint-disable react-hooks/set-state-in-effect */
// import { useEffect, useMemo, useRef, useState } from "react";
// import Modal from "../shared/Modal";
// import Button from "../shared/Button";
// import { getTemplate } from "../../config/vehicleTemplates";

// const DEFAULT_MARKER = { xPct: 50, yPct: 35 };

// const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// /**
//  * Computes the "contain" fit box inside the container:
//  * - image is rendered with object-contain
//  * - there may be letterboxing (empty space)
//  * This returns the exact area where the image pixels are drawn.
//  */
// function computeContainBox(containerRect, naturalW, naturalH) {
//   const cw = containerRect.width;
//   const ch = containerRect.height;
//   if (!cw || !ch || !naturalW || !naturalH) {
//     return { offsetX: 0, offsetY: 0, drawW: cw, drawH: ch };
//   }

//   const imgRatio = naturalW / naturalH;
//   const boxRatio = cw / ch;

//   // If container is wider (relative) than image -> fit by height
//   if (boxRatio > imgRatio) {
//     const drawH = ch;
//     const drawW = drawH * imgRatio;
//     const offsetX = (cw - drawW) / 2;
//     return { offsetX, offsetY: 0, drawW, drawH };
//   }

//   // Fit by width
//   const drawW = cw;
//   const drawH = drawW / imgRatio;
//   const offsetY = (ch - drawH) / 2;
//   return { offsetX: 0, offsetY, drawW, drawH };
// }

// const AssignBatteryMarkerModal = ({ isOpen, diagram, onClose, onSave }) => {
//   const containerRef = useRef(null);
//   const imgRef = useRef(null);

//   const [marker, setMarker] = useState(DEFAULT_MARKER);
//   const [fit, setFit] = useState({ offsetX: 0, offsetY: 0, drawW: 0, drawH: 0 });
//   const [imgReady, setImgReady] = useState(false);

//   const draggingRef = useRef(false);

//   const imageSrc = useMemo(() => {
//     if (!diagram) return null;
//     const tpl = getTemplate(diagram?.templateId);
//     return diagram?.diagramUrl || tpl?.src || null;
//   }, [diagram]);

//   useEffect(() => {
//     if (!isOpen) return;

//     if (diagram?.marker?.xPct != null && diagram?.marker?.yPct != null) {
//       setMarker({
//         xPct: Number(diagram.marker.xPct),
//         yPct: Number(diagram.marker.yPct),
//       });
//     } else {
//       setMarker(DEFAULT_MARKER);
//     }
//   }, [isOpen, diagram]);

//   const recalcFit = () => {
//     const container = containerRef.current;
//     const img = imgRef.current;
//     if (!container || !img) return;

//     const rect = container.getBoundingClientRect();
//     const naturalW = img.naturalWidth;
//     const naturalH = img.naturalHeight;

//     const box = computeContainBox(rect, naturalW, naturalH);
//     setFit(box);
//   };

//   // Recalc when image loads
//   const handleImgLoad = () => {
//     setImgReady(true);
//     recalcFit();
//   };

//   // Recalc on resize (responsive)
//   useEffect(() => {
//     if (!isOpen) return;

//     const el = containerRef.current;
//     if (!el) return;

//     const ro = new ResizeObserver(() => recalcFit());
//     ro.observe(el);

//     return () => ro.disconnect();
//   }, [isOpen]);

//   const setMarkerFromClientPoint = (clientX, clientY) => {
//     const container = containerRef.current;
//     if (!container) return;

//     const rect = container.getBoundingClientRect();
//     const { offsetX, offsetY, drawW, drawH } = fit;

//     if (!drawW || !drawH) return;

//     // Convert to image-drawn coordinates (remove letterboxing)
//     const xIn = clientX - rect.left - offsetX;
//     const yIn = clientY - rect.top - offsetY;

//     // If clicking outside the image (letterbox area), ignore
//     if (xIn < 0 || yIn < 0 || xIn > drawW || yIn > drawH) return;

//     const xPct = clamp((xIn / drawW) * 100, 0, 100);
//     const yPct = clamp((yIn / drawH) * 100, 0, 100);

//     setMarker({ xPct: Number(xPct.toFixed(2)), yPct: Number(yPct.toFixed(2)) });
//   };

//   const onPointerDown = (e) => {
//     if (!imgReady) return;
//     draggingRef.current = true;
//     try {
//       e.currentTarget.setPointerCapture?.(e.pointerId);
//     } catch {
//       // ignore
//     }
//     setMarkerFromClientPoint(e.clientX, e.clientY);
//   };

//   const onPointerMove = (e) => {
//     if (!draggingRef.current) return;
//     setMarkerFromClientPoint(e.clientX, e.clientY);
//   };

//   const onPointerUp = () => {
//     draggingRef.current = false;
//   };

//   const handleSave = () => {
//     if (!diagram?.id) return;
//     onSave(diagram.id, marker);
//   };

//   if (!diagram) return null;

//   const yearLabel =
//     diagram.yearFrom && diagram.yearTo
//       ? `${diagram.yearFrom}-${diagram.yearTo}`
//       : diagram.yearFrom || "--";

//   const canSave = Boolean(diagram?.id && imageSrc && imgReady);

//   // Render marker in correct pixel position inside container (respecting contain offsets)
//   const markerStyle =
//     fit.drawW && fit.drawH
//       ? {
//           left: `${fit.offsetX + (marker.xPct / 100) * fit.drawW}px`,
//           top: `${fit.offsetY + (marker.yPct / 100) * fit.drawH}px`,
//           transform: "translate(-50%, -50%)",
//         }
//       : { left: "50%", top: "35%", transform: "translate(-50%, -50%)" };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Assign Battery Marker" size="md">
//       <div className="space-y-4">
//         <div className="text-center text-xs font-semibold text-slate-800">
//           {diagram.make} {diagram.model}
//           <div className="text-[11px] text-slate-500">{yearLabel}</div>
//         </div>

//         <div
//           ref={containerRef}
//           className="relative mx-auto w-full max-w-xs aspect-3/5 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden"
//           style={{ touchAction: "none", cursor: imgReady ? "crosshair" : "default" }}
//           onPointerDown={onPointerDown}
//           onPointerMove={onPointerMove}
//           onPointerUp={onPointerUp}
//           onPointerCancel={onPointerUp}
//         >
//           {imageSrc ? (
//             <img
//               ref={imgRef}
//               src={imageSrc}
//               alt="Diagram"
//               className="absolute inset-0 h-full w-full object-contain select-none"
//               draggable={false}
//               onLoad={handleImgLoad}
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
//               No template / diagram available
//             </div>
//           )}

//           {/* Marker */}
//           {imageSrc && (
//             <div
//               className="absolute w-9 h-9 rounded-full bg-red-600 shadow-lg border-2 border-white flex items-center justify-center text-white text-lg"
//               style={markerStyle}
//               title={`x=${marker.xPct}%, y=${marker.yPct}%`}
//             >
//               🔋
//             </div>
//           )}
//         </div>

//         <p className="text-[11px] text-slate-500 text-center">
//           Click or drag on the diagram to place the battery marker. It saves as % of the image area
//           (so it stays correct on all screen sizes).
//           <br />
//           <span className="text-slate-600">
//             x: <b>{marker.xPct.toFixed(2)}%</b>, y: <b>{marker.yPct.toFixed(2)}%</b>
//           </span>
//         </p>

//         <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between">
//           <Button type="button" variant="secondary" fullWidth onClick={onClose}>
//             Close
//           </Button>
//           <Button type="button" fullWidth onClick={handleSave} disabled={!canSave}>
//             Save Changes
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default AssignBatteryMarkerModal;


import { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { VehicleBatteryDiagramPicker } from "../diagram/VehicleBatteryDiagram";

const DEFAULT_MARKER = { xPct: 50, yPct: 35 };

const getPrimaryMarker = (diagram) => {
  if (diagram?.marker?.xPct != null && diagram?.marker?.yPct != null) {
    return {
      xPct: Number(diagram.marker.xPct),
      yPct: Number(diagram.marker.yPct),
    };
  }

  if (Array.isArray(diagram?.markers) && diagram.markers[0]) {
    return {
      xPct: Number(diagram.markers[0].xPct),
      yPct: Number(diagram.markers[0].yPct),
    };
  }

  return DEFAULT_MARKER;
};

const AssignBatteryMarkerModal = ({ isOpen, diagram, onClose, onSave }) => {
  const [markerValue, setMarkerValue] = useState(DEFAULT_MARKER);

  useEffect(() => {
    if (!isOpen) return;
    setMarkerValue(getPrimaryMarker(diagram));
  }, [isOpen, diagram]);

  const yearLabel = useMemo(() => {
    if (!diagram) return "--";
    if (diagram.yearFrom && diagram.yearTo) return `${diagram.yearFrom}-${diagram.yearTo}`;
    return diagram.yearFrom || "--";
  }, [diagram]);

  const handleSave = () => {
    if (!diagram?.id) return;
    onSave?.(diagram.id, markerValue);
  };

  if (!diagram) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Battery Marker" size="md">
      <div className="space-y-4">
        <div className="text-center text-xs font-semibold text-slate-800">
          {diagram.make} {diagram.model}
          <div className="text-[11px] text-slate-500">{yearLabel}</div>
        </div>

        <div className="mx-auto w-full max-w-xs rounded-lg border border-slate-300 bg-slate-100 p-4">
          <VehicleBatteryDiagramPicker
            templateId={diagram.templateId}
            diagramUrl={diagram.diagramUrl}
            value={markerValue}
            onChange={setMarkerValue}
            className="mx-auto w-full"
          />
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Click or drag on the diagram to place the battery marker. It saves as % of the image area
          so it stays correct on all screen sizes.
          <br />
          <span className="text-slate-700">
            x: <b>{markerValue.xPct.toFixed(2)}%</b>, y: <b>{markerValue.yPct.toFixed(2)}%</b>
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Close
          </Button>
          <Button type="button" fullWidth onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignBatteryMarkerModal;
