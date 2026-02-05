import { Link } from "react-router-dom";
import { ROUTES } from "../../routes/routes";

interface Survey {
  surveyName: string;
  pm: string;
  totalPaid: string;
  totalCompletes: number;
  startMonth: string;
}

type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startMonth";

interface SurveysTableProps {
  surveys: Survey[];
  sortBy: SortColumn | null;
  sortOrder: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  renderSortIcon: (column: SortColumn) => React.ReactNode;
}

export const SurveysTable = ({
  surveys,
  onSort,
  renderSortIcon,
}: SurveysTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-4 font-medium text-gray-900">
              <button
                onClick={() => onSort("surveyName")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Survey Name
                {renderSortIcon("surveyName")}
              </button>
            </th>
            <th className="text-left p-4 font-medium text-gray-900">PM</th>
            <th className="text-left p-4 font-medium text-gray-900">
              <button
                onClick={() => onSort("totalPaid")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Total Paid
                {renderSortIcon("totalPaid")}
              </button>
            </th>
            <th className="text-left p-4 font-medium text-gray-900">
              <button
                onClick={() => onSort("totalCompletes")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Completes
                {renderSortIcon("totalCompletes")}
              </button>
            </th>
            <th className="text-left p-4 font-medium text-gray-900">
              <button
                onClick={() => onSort("startMonth")}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Start Month
                {renderSortIcon("startMonth")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {surveys.map((survey) => (
            <tr
              key={survey.surveyName}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="p-4 text-sm font-medium text-gray-900">
                <Link
                  to={ROUTES.SURVEY_DETAIL(survey.surveyName)}
                  className="text-blue-600 hover:underline"
                >
                  {survey.surveyName}
                </Link>
              </td>
              <td className="p-4 text-sm text-gray-700">{survey.pm}</td>
              <td className="p-4 text-sm text-gray-700">{survey.totalPaid}</td>
              <td className="p-4 text-sm text-gray-700">
                {survey.totalCompletes}
              </td>
              <td className="p-4 text-sm text-gray-700">{survey.startMonth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
