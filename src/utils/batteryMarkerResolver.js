export const DEFAULT_TEMPLATE_ID = "sedan_top_v1";

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n)));

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/windsheild/g, "windshield")
    .replace(/passenger side/g, "passenger's side")
    .replace(/driver side/g, "driver's side")
    .replace(/drivers/g, "driver's")
    .replace(/passengers/g, "passenger's")
    .replace(/\s+/g, " ");
}

function marker(xPct, yPct) {
  return {
    xPct: Number(clamp(xPct).toFixed(2)),
    yPct: Number(clamp(yPct).toFixed(2)),
  };
}

export function resolveSingleBatteryMarker(locationText = "") {
  const text = normalizeText(locationText);

  if (!text) return null;

  if (
    text.includes("under the hood") ||
    text.includes("front trunk") ||
    text.includes("frunk") ||
    text.includes("tool tray")
  ) {
    const x = text.includes("driver's side") ? 36 : text.includes("passenger's side") ? 64 : 50;

    if (text.includes("front of the car") || text.includes("front of car")) {
      return marker(x, 13.5);
    }

    if (
      text.includes("close to windshield") ||
      text.includes("behind the front trunk") ||
      text.includes("inside front trunk")
    ) {
      return marker(x, 20);
    }

    return marker(x, 17);
  }

  if (text.includes("trunk")) {
    const x = text.includes("driver's side") ? 32 : text.includes("passenger's side") ? 68 : 50;

    if (text.includes("back bumper") || text.includes("close to the bumper")) {
      return marker(50, 88);
    }

    if (
      text.includes("against the back of the rear seat") ||
      text.includes("close to seating area") ||
      text.includes("towards front of car")
    ) {
      return marker(x, 74);
    }

    if (
      text.includes("side panel") ||
      text.includes("behind side panel") ||
      text.includes("bottom side panel")
    ) {
      return marker(x, 79);
    }

    if (text.includes("under spare tire")) {
      return marker(50, 84);
    }

    if (
      text.includes("under floor paneling") ||
      text.includes("under floor panel") ||
      text.includes("under paneling") ||
      text.includes("under panel")
    ) {
      return marker(x === 50 ? 50 : x, x === 50 ? 83 : 82);
    }

    if (text.includes("above trunk")) {
      return marker(50, 76);
    }

    return marker(x, x === 50 ? 83 : 81);
  }

  if (text.includes("footwell")) {
    if (text.includes("passenger's side") && text.includes("back seat")) return marker(58, 56);
    if (text.includes("passenger's side") && text.includes("front seat")) return marker(58, 37);
    if (text.includes("driver's side")) return marker(42, 37);
    return marker(50, 45);
  }

  if (text.includes("under front driver's side seat")) return marker(42, 46);
  if (text.includes("under front passenger seat")) return marker(58, 46);
  if (text.includes("behind passenger seat")) return marker(58, 53);
  if (text.includes("under the driver's seat") || text.includes("under driver's seat")) {
    return marker(42, 49);
  }

  if (
    text.includes("under rear drivers side seat") ||
    text.includes("under the cushion of the rear driver's side seat") ||
    (text.includes("rear seat") && text.includes("driver's side"))
  ) {
    return marker(42, 61);
  }

  if (
    text.includes("under the cushion of the rear passenger's seat") ||
    (text.includes("rear seat") && text.includes("passenger's side"))
  ) {
    return marker(58, 61);
  }

  if (text.includes("wheel well")) {
    if (text.includes("front passenger")) return marker(80, 33);
    if (text.includes("front driver's side") || text.includes("front driver")) return marker(20, 33);
    if (text.includes("rear driver") || text.includes("back driver's side")) return marker(20, 81);
    if (text.includes("back passenger") || text.includes("rear passenger")) return marker(80, 81);
  }

  if (text.includes("under the car / under the trunk area")) return marker(50, 92);
  if (text.includes("rear side panel / driver's side")) return marker(29, 77);
  if (text.includes("on the passenger side of the engine")) return marker(68, 79);

  const fallbackX = text.includes("driver's side") ? 36 : text.includes("passenger's side") ? 64 : 50;
  const fallbackY = text.includes("rear") ? 78 : text.includes("front") ? 20 : 50;
  return marker(fallbackX, fallbackY);
}

export function resolveBatteryMarkers(locationText = "") {
  const source = String(locationText || "").trim();
  if (!source) return [];

  const normalized = normalizeText(source);

  if (
    normalized.includes("passenger side and drivers") &&
    normalized.includes("against the back of the rear seat")
  ) {
    return [marker(35, 74), marker(65, 74)];
  }

  if (normalized.startsWith("2 batteries")) {
    const cleaned = source.replace(/^2 batteries\s*-\s*/i, "");
    return cleaned
      .split(/\s+(?:and|&)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .map(resolveSingleBatteryMarker)
      .filter(Boolean);
  }

  const single = resolveSingleBatteryMarker(source);
  return single ? [single] : [];
}

export function resolvePrimaryBatteryMarker(locationText = "") {
  return resolveBatteryMarkers(locationText)[0] || null;
}

export function normalizeMarkerList(markers, markerValue) {
  if (Array.isArray(markers) && markers.length > 0) {
    return markers
      .map((item) => {
        const xPct = Number(item?.xPct);
        const yPct = Number(item?.yPct);
        if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
        return marker(xPct, yPct);
      })
      .filter(Boolean);
  }

  if (markerValue?.xPct != null && markerValue?.yPct != null) {
    return [marker(markerValue.xPct, markerValue.yPct)];
  }

  return [];
}