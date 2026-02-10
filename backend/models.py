from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from pydantic import BaseModel, field_validator
from helpers import serialize_datetime_to_iso

class PointsDb(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pid = Column("PID", String, nullable=False)
    cpi = Column("CPI", Integer, nullable=False)
    stime = Column("STIME", DateTime, nullable=False, index=True)
    project = Column("PROJECT", String, nullable=False, index=True)
    supplier = Column("SUPPLIER", Integer, nullable=False)
    pm = Column("PM", Integer, nullable=False, index=True)
    
#To be created database to store PM names"""
class PmNames(Base):
    __tablename__ = "pm_names"

    id = Column(Integer, primary_key=True, autoincrement=False)
    pm_name = Column("PM_NAME", String, nullable=False)

#To be created database to store supplier names"""
class SupplierNames(Base):
    __tablename__ = "supplier_names"

    id = Column(Integer, primary_key=True, autoincrement=False)
    supplier_name = Column("SUPPLIER_NAME", String, nullable=False)

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

    @field_validator("stime", mode="before")
    @classmethod
    def validate_stime(cls, v):
        """Serialize datetime to ISO8601 string using helpers."""
        return serialize_datetime_to_iso(v)