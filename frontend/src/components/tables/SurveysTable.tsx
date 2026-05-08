import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface Survey {
  surveyName: string;
  pm: string;
  totalPaid: number;
  totalCompletes: number;
  startDate: string;
  client?: string | null;
  askia_description?: string | null;
  surveytype?: string | null;
  target?: number | null;
  ir?: number | null;
  suppliers?: string[];
}

type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startDate";

interface SurveysTableProps {
  surveys: Survey[];
  sortBy: SortColumn | null;
  sortOrder: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  renderSortIcon: (column: SortColumn) => React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SUPPLIER_COLORS: Record<string, string> = {
  Fulcrum: "#ef4444",
  PureSpectrum: "#3b82f6",
  Cint: "#10b981",
  Nebu: "#8b5cf6",
  Dynata: "#06b6d4",
  Toluna: "#84cc16",
  DataSpring: "#f59e0b",
  Borderless: "#ec4899",
  LiquidOpinions: "#a855f7",
};

const SUPPLIER_BG: Record<string, string> = {
  Fulcrum: "bg-red-50 text-red-700",
  PureSpectrum: "bg-blue-50 text-blue-700",
  Cint: "bg-emerald-50 text-emerald-700",
  Nebu: "bg-violet-50 text-violet-700",
  Dynata: "bg-cyan-50 text-cyan-700",
  Toluna: "bg-lime-50 text-lime-700",
  DataSpring: "bg-amber-50 text-amber-700",
  Borderless: "bg-pink-50 text-pink-700",
  LiquidOpinions: "bg-purple-50 text-purple-700",
};

export const SurveysTable = ({
  surveys,
  onSort,
  renderSortIcon,
  searchQuery,
  onSearchChange,
}: SurveysTableProps) => {
  const SortHeader = ({
    column,
    children,
  }: {
    column: SortColumn;
    children: React.ReactNode;
  }) => (
    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        {children}
        {renderSortIcon(column)}
      </button>
    </th>
  );

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3">
        <div className="relative max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search RDR number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHeader column="surveyName">Survey</SortHeader>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Client / Study
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                PM
              </th>
              <SortHeader column="totalPaid">Total Paid</SortHeader>
              <SortHeader column="totalCompletes">Completes</SortHeader>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Target
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                IR
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Suppliers
              </th>
              <SortHeader column="startDate">Start Date</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {surveys.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No surveys found
                </td>
              </tr>
            ) : (
              surveys.map((s) => (
                <tr
                  key={`${s.surveyName}-${s.pm}`}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Survey Name */}
                  <td className="px-4 py-3">
                    <Link
                      to={ROUTES.SURVEY_DETAIL(s.surveyName)}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      {s.surveyName}
                    </Link>
                  </td>

                  {/* Client / Study */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {s.client ? (
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {s.client}
                        </span>
                        {s.askia_description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {s.askia_description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* PM */}
                  <td className="px-4 py-3 text-sm text-gray-700">{s.pm}</td>

                  {/* Total Paid */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    £{Number(s.totalPaid).toFixed(2)}
                  </td>

                  {/* Completes */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.totalCompletes.toLocaleString()}
                  </td>
                  {/* Target */}
                  <td className="px-4 py-3">
                    {s.target != null ? (
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {s.target.toLocaleString()}
                        </span>
                        {s.surveytype && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {s.surveytype}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* IR */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.ir != null ? (
                      `${s.ir}%`
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Supplier tags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.suppliers ?? []).length > 0 ? (
                        s.suppliers!.map((sup) => (
                          <span
                            key={sup}
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              SUPPLIER_BG[sup] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sup}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </td>

                  {/* Start Date */}
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {s.startDate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
