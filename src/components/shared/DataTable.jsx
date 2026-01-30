import React from "react";

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data",
  className = "",
}) => {
  const showLoadingOnly = loading && data.length === 0;
  const showRefreshing = loading && data.length > 0;
  const showEmpty = !loading && data.length === 0;

  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => {
              const key = col.key || col.accessor;
              return (
                <th
                  key={key}
                  className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.label || col.title || col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {showLoadingOnly && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-4 text-center text-xs text-slate-500"
              >
                Loading...
              </td>
            </tr>
          )}

          {showRefreshing && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-3 text-center text-[11px] text-slate-500 bg-slate-50/60"
              >
                Refreshing...
              </td>
            </tr>
          )}

          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50/60">
              {columns.map((col) => {
                const key = col.key || col.accessor;
                const accessor = col.accessor || col.key;
                return (
                  <td
                    key={key}
                    className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap align-middle"
                  >
                    {col.render ? col.render(row) : row[accessor]}
                  </td>
                );
              })}
            </tr>
          ))}

          {showEmpty && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-4 text-center text-xs text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
