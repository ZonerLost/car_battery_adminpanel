export type VehicleTemplateId = "sedan_top_v1";

export type VehicleTemplate = {
  id: VehicleTemplateId;
  label: string;
  /** Put the client outline image in /public/templates/sedan_top_v1.png (or jpg) */
  src: string;
};

export const VEHICLE_TEMPLATES: Record<VehicleTemplateId, VehicleTemplate> = {
  sedan_top_v1: {
    id: "sedan_top_v1",
    label: "Sedan (Top View)",
    src: "/templates/sedan_top_v1.jpeg", // or .png
  },
};

export function getTemplate(templateId?: string | null) {
  const key = (templateId || "sedan_top_v1") as VehicleTemplateId;
  return VEHICLE_TEMPLATES[key] || VEHICLE_TEMPLATES.sedan_top_v1;
}

/**
 * Optional: infer template from bodyType
 * (you can improve this later when you add more templates)
 */
export function inferTemplateId(bodyType?: string | null): VehicleTemplateId {
  const t = String(bodyType || "").toLowerCase();
  // later: if (t.includes("suv")) return "suv_top_v1";
  return "sedan_top_v1";
}
