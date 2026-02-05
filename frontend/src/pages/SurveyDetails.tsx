import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { surveyPoints } from "../data/mockData";
import { SurveyPointsTable } from "../components/tables/SurveyPointsTable";

const SurveyDetail = () => {
  const navigate = useNavigate();
  const { surveyName } = useParams<{ surveyName: string }>();

  // Hardcoded placeholder
  const points = surveyPoints[surveyName ?? ""] ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Survey: {surveyName}</h1>
      </div>

      <h2 className="text-lg font-semibold mb-4">Point Records</h2>
      <SurveyPointsTable points={points} />
    </div>
  );
};

export default SurveyDetail;
