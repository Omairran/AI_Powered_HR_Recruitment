"""
URL Configuration for Jobs App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, JobApplicationViewSet
from .matching_views import MatchingViewSet  # ADD THIS


router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'job-applications', JobApplicationViewSet, basename='job-application')
router.register(r'matching', MatchingViewSet, basename='matching')

urlpatterns = [
    path('', include(router.urls)),
]

"""
Available Endpoints:

JOB ENDPOINTS:
--------------
GET     /api/jobs/                          - List all jobs (with filters)
POST    /api/jobs/                          - Create new job (requires auth)
GET     /api/jobs/{id}/                     - Get job details
PATCH   /api/jobs/{id}/                     - Update job (requires auth)
DELETE  /api/jobs/{id}/                     - Delete job (requires auth)
GET     /api/jobs/active/                   - List active jobs only
GET     /api/jobs/{id}/applications/        - Get applications for job
POST    /api/jobs/{id}/publish/             - Publish draft job (requires auth)
POST    /api/jobs/{id}/close/               - Close active job (requires auth)
GET     /api/jobs/stats/                    - Get job statistics

QUERY PARAMETERS for GET /api/jobs/:
------------------------------------
- status: Filter by status (draft, active, closed, on_hold)
- employment_type: Filter by type (full_time, part_time, etc.)
- location: Search by location (partial match)
- is_remote: Filter remote jobs (true/false)
- search: Search in title, company, description
- skills: Filter by required skills (comma-separated)

Example: /api/jobs/?status=active&is_remote=true&skills=Python,Django


JOB APPLICATION ENDPOINTS:
--------------------------
GET     /api/job-applications/                      - List all applications (requires auth)
POST    /api/job-applications/                      - Submit application
GET     /api/job-applications/{id}/                 - Get application details
PATCH   /api/job-applications/{id}/                 - Update application (requires auth)
DELETE  /api/job-applications/{id}/                 - Delete application (requires auth)
POST    /api/job-applications/{id}/update_status/   - Update application status (requires auth)
GET     /api/job-applications/my_applications/      - Get applications by email

QUERY PARAMETERS for GET /api/job-applications/:
-------------------------------------------------
- job_id: Filter by job
- candidate_id: Filter by candidate
- status: Filter by status
- sort_by: Sort applications (match_score, applied_at)

Example: /api/job-applications/?job_id=5&status=shortlisted&sort_by=match_score
"""

