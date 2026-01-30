import MetricCard from "../shared/MetricCard";

const DashboardMetrics = ({ metrics = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          deltaLabel={metric.deltaLabel}
          deltaType={metric.deltaType}
          helperText={metric.helperText}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;
