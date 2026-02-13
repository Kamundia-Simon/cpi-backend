import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

interface Project {
  surveyName: string;
  totalPaid: string;
  totalCompletes: number;
  startDate: string;
}

type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startDate";

interface PMProjectsTableProps {
  projects: Project[];
  sortBy: SortColumn | null;
  sortOrder: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  renderSortIcon: (column: SortColumn) => React.ReactNode;
}

export const PMProjectsTable = ({
  projects,
  onSort,
  renderSortIcon,
}: PMProjectsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-4 font-semibold text-gray-900">
              <button
                onClick={() => onSort("surveyName")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Survey Name
                {renderSortIcon("surveyName")}
              </button>
            </th>
            <th className="text-left p-4 font-semibold text-gray-900">
              <button
                onClick={() => onSort("totalPaid")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Total Paid
                {renderSortIcon("totalPaid")}
              </button>
            </th>
            <th className="text-left p-4 font-semibold text-gray-900">
              <button
                onClick={() => onSort("totalCompletes")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Completes
                {renderSortIcon("totalCompletes")}
              </button>
            </th>
            <th className="text-left p-4 font-semibold text-gray-900">
              <button
                onClick={() => onSort("startDate")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Start Date
                {renderSortIcon("startDate")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {projects.map((project) => (
            <tr
              key={project.surveyName}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="p-4">
                <Link
                  to={ROUTES.SURVEY_DETAIL(project.surveyName)}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {project.surveyName}
                </Link>
              </td>
              <td className="p-4 text-sm font-medium text-gray-700">{project.totalPaid}</td>
              <td className="p-4 text-sm font-medium text-gray-700">
                {project.totalCompletes}
              </td>
              <td className="p-4 text-sm font-medium text-gray-700">{project.startDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
