interface SurveyPoint {
  pid: string;
  cpi: string;
  supplier: number;
  stime: string;
}

interface SurveyPointsTableProps {
  points: SurveyPoint[];
}

export const SurveyPointsTable = ({ points }: SurveyPointsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-4 font-medium text-gray-900">PID</th>
            <th className="text-left p-4 font-medium text-gray-900">CPI</th>
            <th className="text-left p-4 font-medium text-gray-900">
              Supplier
            </th>
            <th className="text-left p-4 font-medium text-gray-900">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {points.map((point) => (
            <tr key={point.pid} className="hover:bg-gray-50 transition-colors">
              <td className="p-4 text-sm font-medium text-gray-900">
                {point.pid}
              </td>
              <td className="p-4 text-sm text-gray-700">{point.cpi}</td>
              <td className="p-4 text-sm text-gray-700">
                Supplier {point.supplier}
              </td>
              <td className="p-4 text-sm text-gray-700">{point.stime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
