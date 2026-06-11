import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ASKIA_BASE_URL = os.getenv("ASKIA_BASE_URL")
ASKIA_TOKEN = os.getenv("ASKIA_TOKEN")
HEADERS = {"Authorization": f"Bearer {ASKIA_TOKEN}"}


def fetch_all_surveys() -> list[dict]:
    """GET /SurveyTasks/ — returns [{Id, Name, Description}, ...]"""
    r = httpx.get(f"{ASKIA_BASE_URL}/SurveyTasks/", headers=HEADERS, timeout=15)
    r.raise_for_status()
    data = r.json()
    if isinstance(data, dict) and "Response" in data:
        return data["Response"]
    return data if isinstance(data, list) else []


def fetch_finalstatus(askia_id: int) -> dict | None:
    """GET /SurveyTasks/{askia_id}/Quota — returns the FinalStatus question or None."""
    r = httpx.get(
        f"{ASKIA_BASE_URL}/SurveyTasks/{askia_id}/Quota",
        headers=HEADERS,
        timeout=15,
    )
    if r.status_code == 404:
        return None
    r.raise_for_status()
    data = r.json()
    if isinstance(data, dict) and "Response" in data:
        data = data["Response"]
    questions = data if isinstance(data, list) else data.get("Questions", [])
    for q in questions:
        if q.get("QuestionShortcut") == "FinalStatus":
            return q
    return None


def calculate_ir(finalstatus: dict) -> float | None:
    """IR = Complete / (Complete + Screenout + Quotafull + Speedster) * 100"""
    counted = {"Complete", "Screenout", "Quotafull", "Speedster"}
    completes = 0
    denominator = 0
    for resp in finalstatus.get("Responses", []):
        caption = resp.get("ResponseShortCaption", "")
        count = resp.get("InterviewsCompletedCount") or 0
        if caption in counted:
            denominator += count
            if caption == "Complete":
                completes = count
    if not denominator:
        return None
    return round((completes * 100) / denominator, 1)


def parse_client(description: str) -> str:
    """'Firefish - Deo n HE English speaking...' → 'Firefish'"""
    if not description:
        return ""
    return description.split(" - ")[0].strip()