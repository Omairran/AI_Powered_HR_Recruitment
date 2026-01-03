# Job Posting Backend Module
# Dependencies: pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib python-multipart

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum as PyEnum
import jwt
from passlib.context import CryptContext

# ============= Configuration =============
DATABASE_URL = "sqlite:///./jobs.db"  # Change to PostgreSQL/MySQL in production
SECRET_KEY = "your-secret-key-here"  # Use environment variable in production
ALGORITHM = "HS256"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============= Enums =============
class UserRole(str, PyEnum):
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    HR_RECRUITER = "hr_recruiter"
    VIEWER = "viewer"

class EmploymentType(str, PyEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    TEMPORARY = "temporary"

class ExperienceLevel(str, PyEnum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"

class JobStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"

# ============= Database Models =============
job_skills = Table(
    'job_skills', Base.metadata,
    Column('job_id', Integer, ForeignKey('jobs.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    jobs = relationship("Job", back_populates="created_by_user")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    jobs = relationship("Job", back_populates="department")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String)
    jobs = relationship("Job", secondary=job_skills, back_populates="skills")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(Text)
    experience_level = Column(Enum(ExperienceLevel), nullable=False)
    employment_type = Column(Enum(EmploymentType), nullable=False)
    location = Column(String, nullable=False)
    remote_allowed = Column(String, default="no")
    min_education = Column(String)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_currency = Column(String, default="USD")
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    external_post_urls = Column(Text)  # JSON string for external job board URLs
    
    department = relationship("Department", back_populates="jobs")
    skills = relationship("Skill", secondary=job_skills, back_populates="jobs")
    created_by_user = relationship("User", back_populates="jobs")

# ============= Pydantic Schemas =============
class SkillCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: Optional[str] = None

class SkillResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    
    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    
    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    department_id: int
    description: str = Field(..., min_length=50)
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    experience_level: ExperienceLevel
    employment_type: EmploymentType
    location: str = Field(..., min_length=2)
    remote_allowed: Optional[str] = "no"
    min_education: Optional[str] = None
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = "USD"
    skill_ids: List[int] = []
    status: Optional[JobStatus] = JobStatus.DRAFT
    
    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        if v and 'salary_min' in values and values['salary_min']:
            if v < values['salary_min']:
                raise ValueError('salary_max must be greater than salary_min')
        return v

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    department_id: Optional[int] = None
    description: Optional[str] = Field(None, min_length=50)
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    employment_type: Optional[EmploymentType] = None
    location: Optional[str] = None
    remote_allowed: Optional[str] = None
    min_education: Optional[str] = None
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = None
    skill_ids: Optional[List[int]] = None
    status: Optional[JobStatus] = None

class JobResponse(BaseModel):
    id: int
    title: str
    department: DepartmentResponse
    description: str
    requirements: Optional[str]
    responsibilities: Optional[str]
    experience_level: ExperienceLevel
    employment_type: EmploymentType
    location: str
    remote_allowed: str
    min_education: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    status: JobStatus
    skills: List[SkillResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ============= Security & Authentication =============
security = HTTPBearer()

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

def get_current_user(db: Session = Depends(lambda: SessionLocal()), 
                     token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.id == token_data.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def check_permission(allowed_roles: List[UserRole]):
    def permission_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker

# ============= Database Dependency =============
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============= FastAPI Application =============
app = FastAPI(title="Job Posting API", version="1.0.0")

# Initialize database
Base.metadata.create_all(bind=engine)

# ============= API Endpoints =============

# Authentication
@app.post("/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (admin only in production)"""
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    token = create_access_token({"user_id": db_user.id, "role": db_user.role.value})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
def login(email: str, password: str, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}

# Department Management
@app.post("/departments", response_model=DepartmentResponse)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER]))
):
    """Create a new department"""
    db_dept = Department(**department.dict())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@app.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Get all departments"""
    return db.query(Department).all()

# Skill Management
@app.post("/skills", response_model=SkillResponse)
def create_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER]))
):
    """Create a new skill"""
    db_skill = Skill(**skill.dict())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.get("/skills", response_model=List[SkillResponse])
def get_skills(db: Session = Depends(get_db)):
    """Get all skills"""
    return db.query(Skill).all()

# Job Management
@app.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_RECRUITER]))
):
    """Create a new job posting"""
    # Validate department exists
    department = db.query(Department).filter(Department.id == job.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Validate skills exist
    skills = db.query(Skill).filter(Skill.id.in_(job.skill_ids)).all()
    if len(skills) != len(job.skill_ids):
        raise HTTPException(status_code=404, detail="One or more skills not found")
    
    job_data = job.dict(exclude={'skill_ids'})
    db_job = Job(**job_data, created_by=current_user.id)
    db_job.skills = skills
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get("/jobs", response_model=List[JobResponse])
def get_jobs(
    status: Optional[JobStatus] = None,
    department_id: Optional[int] = None,
    experience_level: Optional[ExperienceLevel] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all job postings with optional filters"""
    query = db.query(Job)
    
    if status:
        query = query.filter(Job.status == status)
    if department_id:
        query = query.filter(Job.department_id == department_id)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)
    
    return query.offset(skip).limit(limit).all()

@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job posting"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.put("/jobs/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_RECRUITER]))
):
    """Update a job posting"""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check ownership for recruiters
    if current_user.role == UserRole.HR_RECRUITER and db_job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update own job postings")
    
    update_data = job_update.dict(exclude_unset=True)
    
    # Handle skill updates
    if 'skill_ids' in update_data:
        skill_ids = update_data.pop('skill_ids')
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
        db_job.skills = skills
    
    # Update other fields
    for field, value in update_data.items():
        setattr(db_job, field, value)
    
    db_job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_job)
    return db_job

@app.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER]))
):
    """Delete a job posting (admin and HR manager only)"""
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(db_job)
    db.commit()
    return None

# Extension Points for External Integration
@app.post("/jobs/{job_id}/publish")
def publish_to_external_boards(
    job_id: int,
    board_names: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission([UserRole.ADMIN, UserRole.HR_MANAGER]))
):
    """
    Extension point: Publish job to external job boards
    Implement integration with LinkedIn, Indeed, Glassdoor, etc.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # TODO: Implement actual integration logic here
    # Example structure for external board integration:
    # - LinkedIn Jobs API
    # - Indeed Job Posting API
    # - Custom HRMS webhooks
    
    return {
        "message": "Job publishing initiated",
        "job_id": job_id,
        "boards": board_names,
        "status": "pending"
    }

@app.get("/jobs/{job_id}/analytics")
def get_job_analytics(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extension point: Get job posting analytics
    Can be extended to integrate with external analytics platforms
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # TODO: Implement analytics tracking
    return {
        "job_id": job_id,
        "views": 0,
        "applications": 0,
        "external_clicks": {},
        "message": "Analytics integration pending"
    }

# Health Check
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Run with: uvicorn Umair:app --reload