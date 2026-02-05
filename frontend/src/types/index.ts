// PM mapping
export type PMId = 1 | 2 | 3;

export interface PM {
  id: PMId;
  name: string;
}

export interface ProjectRaw {
  id: string;        
  surveyName: string;
  totalPaid: number;
  startMonth: string;
  totalCompletes: number;
  pmId: PMId;
}

// Frontend-transformed project
export interface Project extends Omit<ProjectRaw, 'startMonth'> {
  totalPaidDisplay: number;
  startMonth: Date;
}

//POINT data specs
export interface PointRecordRaw {
  id: number;
  pid: string;
  cpi: number;
  stime: string;         
  project: string;        
  supplier: number;
  pm: PMId;              
}

// Frontend-transformed point record
export interface PointRecord extends Omit<PointRecordRaw, 'stime'> {
  cpiDisplay: number;
  stime: Date;           
}

export interface TrendDataPoint {
  date: Date;
  amount: number;
}
