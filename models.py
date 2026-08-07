from sqlalchemy import Column, Integer, String, DateTime, Float, Numeric, Text, LargeBinary
from database import Base
from datetime import datetime
from pydantic import BaseModel, field_validator
from helpers import correct_excel_datetime, serialize_datetime_to_iso

class PointsDb(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pid = Column("pid", String(255), nullable=False)
    cpi = Column("cpi", Integer, nullable=False)
    stime = Column("stime", DateTime, nullable=False, index=True)
    project = Column("project", String(255), nullable=False, index=True)
    supplier = Column("supplier", Integer, nullable=False)
    pm = Column("pm", Integer, nullable=False, index=True)
    surveyid = Column("surveyid", Integer, nullable=True, index=True)
    surveytype = Column("surveytype", String(255), nullable=True)
    target = Column("target", Integer, nullable=True)
    status = Column("status", Integer, nullable=False, default=1)

class SurveyMeta(Base):
    __tablename__ = "meta"

    surveyid          = Column(Integer, primary_key=True)
    description = Column(String(500))
    client            = Column(String(255))
    last_ir           = Column(Float)
    irtime     = Column(DateTime)
    
class ReconcileHistory(Base):
    __tablename__ = "reconcile_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    surveyid = Column(String(255), nullable=False, index=True)
    reconciled_at = Column(DateTime, nullable=False)
    total_ids = Column(Integer, nullable=False)
    usable = Column(Integer, nullable=False)
    unusable = Column(Integer, nullable=False, default=0)
    not_found = Column(Integer, nullable=False, default=0)
    supplier = Column(Integer, nullable=False)
    batch_id = Column(String(36), nullable=True, index=True)
    screenshot = Column(LargeBinary, nullable=True)
    screenshot_mime = Column(String(50), nullable=True)
    
    
class ProjectCosts(Base):
    __tablename__ = "project_costs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_name = Column(String(255), nullable=False, unique=True, index=True)
    revenue_gbp = Column(Numeric(10, 2), nullable=False)
    translations_gbp = Column(Numeric(10, 2), nullable=False, default=0)
    researcher_cost_gbp = Column(Numeric(10, 2), nullable=False, default=0)
    additional_outgoing_gbp = Column(Numeric(10, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    uploaded_by = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
# GET /api/pms
class PMResponse(BaseModel):
    id: int
    name: str

# GET /api/suppliers
class SupplierResponse(BaseModel):
    id:int
    name:str
    
# /api/pms/{pmId}/summary
class PMSummaryResponse(BaseModel):
    totalAmount: float
    avgPerProject: float
    totalProjects: int

# GET /api/surveys — supplier breakdown per row
class SupplierBreakdownItem(BaseModel):
    supplier: str
    completes: int
    spend: float
    
# GET /api/surveys
class SurveyResponse(BaseModel):
    surveyName: str
    pm: str
    totalPaid: float
    totalCompletes: int
    startDate: str
    client:            str | None = None
    askia_description: str | None = None
    surveytype:        str | None = None
    target:            int | None = None
    ir:                float | None = None
    suppliers:         list[str] = []
    supplier_breakdown: list[SupplierBreakdownItem] = []
    last_reconciled: str | None = None
    reconcile_note: str | None = None

# GET /api/surveys/{surveyName}/points
class PointsResponse(BaseModel):
    id: int
    pid: str
    cpi: int
    supplier: str
    stime: str
    suppname: str | None

    @field_validator("stime", mode="before")
    @classmethod
    def validate_stime(cls, v):
        """Serialize datetime to ISO8601 string using helpers."""
        if isinstance(v, datetime):
            v = correct_excel_datetime(v)
        return serialize_datetime_to_iso(v)

# GET /api/analytics/supplier-spend
class SupplierSpendRow(BaseModel):
    month: str
    supplier: str
    spend: float
    completes: int
    
# POST /api/surveys/{surveyName}/reconcile — request body
class ReconcilePayload(BaseModel):
    pids: list[str]
    supplier_id: int | None = None

# POST /api/surveys/{surveyName}/reconcile
class ReconcileResponse(BaseModel):
    project: str
    total_in_db: int
    total_usable: int
    total_marked_unusable: int
    total_restored: int = 0
    pids_not_found: list[str]
    batch_id: str
    supplier: int

class ReconcileHistoryResponse(BaseModel):
    id: int
    surveyid: str
    reconciled_at: str
    total_ids: int
    usable: int
    unusable: int
    not_found: int
    batch_id: str | None
    has_screenshot: bool = False
    supplier: int

class PMReconcileSurveyResult(BaseModel):
    survey: str
    excluded: int

class PMReconcileResponse(BaseModel):
    surveys_affected: list[PMReconcileSurveyResult]
    total_excluded: int
    total_restored: int = 0
    already_excluded: int = 0
    pids_not_found: list[str]
    batch_id: str
    

class ProjectCostUpsert(BaseModel):
    survey_name: str
    revenue_gbp: float
    translations_gbp: float = 0
    researcher_cost_gbp: float = 0
    additional_outgoing_gbp: float = 0
    notes: str | None = None


class ProjectCostRow(BaseModel):
    survey_name: str
    revenue_gbp: float
    sample_cost_gbp: float
    translations_gbp: float
    researcher_cost_gbp: float
    additional_outgoing_gbp: float
    total_outgoings_gbp: float
    net_gbp: float
    margin_pct: float | None
    notes: str | None = None
    uploaded_by: str | None = None
    uploaded_at: str | None = None
    is_reconciled: bool


class UploadRowError(BaseModel):
    row: int
    survey_name: str | None
    error: str


class UploadResult(BaseModel):
    inserted: int
    updated: int
    errors: list[UploadRowError]


class TrendPoint(BaseModel):
    month: str
    label: str
    revenue: float
    outgoings: float
    net: float
    
class ReconcileBatchResponse(BaseModel):
    batch_id: str
    reconciled_at: str
    surveys: list[str]
    has_screenshot: bool
    supplier: int