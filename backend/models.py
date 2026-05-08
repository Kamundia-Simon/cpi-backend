from sqlalchemy import Column, Integer, String, DateTime, Float
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

# POST /api/surveys/{surveyName}/reconcile
class ReconcileResponse(BaseModel):
    project: str
    total_in_db: int
    total_usable: int
    total_marked_unusable: int
    pids_not_found: list[str]