const RANGE_OPTIONS = [
  { value: "thisMonth", label: "This Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
  { value: "allTime", label: "All Time" },
];

export const DASHBOARD_RANGE_OPTIONS = RANGE_OPTIONS;

export const REPORT_RANGE_OPTIONS = [
  { value: "thisMonth", label: "This Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
  { value: "allTime", label: "All Time" },
];

export function toDateSafe(value) {
  if (!value) return null;
  if (value?.toDate?.()) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const isProductionEnv = () => {
  if (typeof process !== "undefined" && process?.env?.NODE_ENV) {
    return process.env.NODE_ENV === "production";
  }

  if (typeof import.meta !== "undefined" && import.meta?.env?.MODE) {
    return import.meta.env.MODE === "production";
  }

  return false;
};

function getRangeStart(rangeKey, now = new Date()) {
  if (rangeKey === "thisMonth") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (rangeKey === "last3Months") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (rangeKey === "thisYear") return new Date(now.getFullYear(), 0, 1);
  return null; // allTime
}

function isWithinRange(date, rangeKey, now = new Date()) {
  if (!date) return rangeKey === "allTime";
  const start = getRangeStart(rangeKey, now);
  if (!start) return true;
  return date >= start;
}

const pickUpdatedDate = (item) => toDateSafe(item?.updatedAt) || toDateSafe(item?.createdAt);

export function buildDashboardMetrics(cars = [], reports = [], counts = null) {
  const totalCars = counts?.totalCars ?? cars.length;
  const diagramsUploaded = counts?.diagramsUploaded ?? cars.filter((c) => !!c.diagramUrl).length;
  const reportRows = Array.isArray(reports) ? reports : [];

  const pendingReports =
    counts?.pendingReports ??
    reportRows.reduce((sum, r) => {
      const statusNorm = String(r?.statusNorm ?? r?.status ?? "").trim().toLowerCase();
      return statusNorm === "pending" ? sum + 1 : sum;
    }, 0);

  if (!isProductionEnv()) {
    console.log("[dashboard] metrics counts", {
      carsLen: cars.length,
      reportsLen: reportRows.length,
      counts,
      pendingReports,
    });
  }

  return [
    { id: "cars", title: "Total Cars in Database", value: totalCars.toLocaleString(), deltaLabel: "Live", deltaType: "neutral" },
    { id: "diagrams", title: "Diagrams Uploaded", value: diagramsUploaded.toLocaleString(), deltaLabel: "Live", deltaType: "neutral" },
    { id: "pending", title: "Pending Reports", value: pendingReports.toLocaleString(), deltaLabel: "Live", deltaType: "neutral" },
  ];
}

export function buildCoverageByType(cars = [], rangeKey = "allTime", now = new Date()) {
  const filtered = cars.filter((c) => isWithinRange(pickUpdatedDate(c), rangeKey, now));
  const counts = new Map();

  filtered.forEach((car) => {
    const key = car.bodyType || "Other";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const total = Array.from(counts.values()).reduce((acc, n) => acc + n, 0);

  return Array.from(counts.entries()).map(([name, value]) => ({
    name,
    value,
    percent: total ? Math.round((value / total) * 100) : 0,
  }));
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m), 1);
  return date.toLocaleString("default", { month: "short" });
}

function buildMonthSequence(rangeKey, now, existingKeys) {
  const keys = [];

  if (rangeKey === "thisMonth") {
    keys.push(monthKey(now));
    return keys;
  }

  if (rangeKey === "last3Months") {
    for (let i = 2; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    return keys;
  }

  if (rangeKey === "thisYear") {
    for (let m = 0; m <= now.getMonth(); m += 1) {
      keys.push(monthKey(new Date(now.getFullYear(), m, 1)));
    }
    return keys;
  }

  const sortedExisting = Array.from(existingKeys).sort();
  if (!sortedExisting.length) return [];
  // keep the latest 12 months to avoid very long charts
  const tail = sortedExisting.slice(-12);
  return tail;
}

export function buildMonthlyReportsTrend(reports = [], rangeKey = "thisYear", now = new Date()) {
  const filtered = reports.filter((r) => isWithinRange(pickUpdatedDate(r), rangeKey, now));
  const counts = new Map();

  filtered.forEach((r) => {
    const d = pickUpdatedDate(r);
    if (!d) return;
    const key = monthKey(d);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const sequence = buildMonthSequence(rangeKey, now, counts.keys());

  return sequence.map((key) => ({
    month: monthLabel(key),
    total: counts.get(key) || 0,
  }));
}

function formatYearLabel(yf, yt) {
  if (yf && yt && yf !== yt) return `${yf}-${yt}`;
  if (yf) return String(yf);
  if (yt) return String(yt);
  return "—";
}

export function buildOverviewRows(cars = []) {
  return cars.map((car) => {
    const updated = pickUpdatedDate(car);
    const yf = Number(car?.yearFrom ?? car?.year);
    const yt = Number(car?.yearTo ?? car?.year);
    const yearFrom = Number.isFinite(yf) ? yf : null;
    const yearTo = Number.isFinite(yt) ? yt : null;
    const diagramStatus = car.diagramUrl ? "uploaded" : "missing";

    return {
      id: car.id,
      make: car.make || "—",
      model: car.model || "—",
      year: yearFrom ?? yearTo ?? null,
      yearLabel: formatYearLabel(yearFrom, yearTo),
      yearFrom,
      yearTo,
      diagramStatus,
      lastUploaded: updated ? updated.toLocaleDateString() : "—",
    };
  });
}

export function buildYearRangeOptions(rows = [], step = 5) {
  const years = rows
    .flatMap((r) => [Number(r.yearFrom), Number(r.yearTo)].filter((y) => Number.isFinite(y)))
    .filter((y) => Number.isFinite(y));

  if (!years.length) {
    return [
      { value: "all", label: "All Years" },
      { value: "last5", label: "Last 5 Years" },
    ];
  }

  const min = Math.min(...years);
  const max = Math.max(...years);

  const ranges = [
    { value: "all", label: "All Years" },
    { value: "last5", label: "Last 5 Years" },
  ];

  const start = Math.floor(min / step) * step;
  for (let y = start; y <= max; y += step) {
    const from = y;
    const to = Math.min(y + (step - 1), max);
    ranges.push({ value: `${from}-${to}`, label: `${from}-${to}` });
  }

  return ranges;
}
