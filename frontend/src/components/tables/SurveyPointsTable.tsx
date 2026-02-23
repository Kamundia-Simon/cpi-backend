import type { ReactNode } from "react";

interface SurveyPoint {
  pid: string;
  cpi: number;
  supplier: string;
  stime: string;
  suppname?: string | null;
}

interface SurveyPointsTableProps {
  points: SurveyPoint[];
  sortBy?: "cpi" | "supplier" | "stime" | null;
  sortOrder?: "asc" | "desc";
  onSort?: (column: "cpi" | "supplier" | "stime") => void;
  renderSortIcon?: (column: "cpi" | "supplier" | "stime") => ReactNode;
}

export const SurveyPointsTable = ({
  points,
  onSort,
  renderSortIcon,
}: SurveyPointsTableProps) => {
  const formatCPI = (cpi: number, isFulcrum: boolean) =>
    `£${(isFulcrum ? (cpi / 100 + 0.17) * 1.05 : cpi / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-3 text-left font-bold text-gray-700">PID</th>
            <th
              className="p-3 text-left font-bold text-gray-700 cursor-pointer hover:bg-gray-200"
              onClick={() => onSort?.("cpi")}
            >
              <div className="flex items-center gap-2">
                CPI
                {renderSortIcon?.("cpi")}
              </div>
            </th>
            <th
              className="p-3 text-left font-bold text-gray-700 cursor-pointer hover:bg-gray-200"
              onClick={() => onSort?.("supplier")}
            >
              <div className="flex items-center gap-2">
                Supplier
                {renderSortIcon?.("supplier")}
              </div>
            </th>
            <th
              className="p-3 text-left font-bold text-gray-700 cursor-pointer hover:bg-gray-200"
              onClick={() => onSort?.("stime")}
            >
              <div className="flex items-center gap-2">
                Timestamp
                {renderSortIcon?.("stime")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {points.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No interviews found matching the selected filters.
              </td>
            </tr>
          ) : (
            points.map((point, index) => (
              <tr
                key={`${point.pid}-${point.stime}-${index}`}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 font-medium text-gray-900">{point.pid}</td>
                <td className="p-3 font-medium text-gray-900">
                  {formatCPI(point.cpi, point.supplier === "Fulcrum")}
                </td>
                <td className="p-3 font-medium text-gray-900">
                  {point.supplier}
                  {point.suppname && (
                    <div className="text-xs text-gray-500 font-normal">
                      {point.suppname}
                    </div>
                  )}
                </td>
                <td className="p-3 font-medium text-gray-700 text-sm">
                  {formatDate(point.stime)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
