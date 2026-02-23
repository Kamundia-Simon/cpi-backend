from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from pydantic import BaseModel, field_validator
from helpers import serialize_datetime_to_iso

class PointsDb(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pid = Column("pid", String(255), nullable=False)
    cpi = Column("cpi", Integer, nullable=False)
    stime = Column("stime", DateTime, nullable=False, index=True)
    project = Column("project", String(255), nullable=False, index=True)
    supplier = Column("supplier", Integer, nullable=False)
    pm = Column("pm", Integer, nullable=False, index=True)
    suppname = Column("suppname", String(255), nullable=True)

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
        return serialize_datetime_to_iso(v)