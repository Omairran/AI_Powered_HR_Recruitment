"""
API Views for Candidate-Job Matching
Add these views to jobs/views.py or create jobs/matching_views.py
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q

from .models import Job, JobApplication
from candidates.models import Candidate
from .serializers import JobApplicationSerializer
from .utils.matching_engine import CandidateJobMatcher


class MatchingViewSet(viewsets.ViewSet):
    """
    ViewSet for AI matching operations
    
    Endpoints:
    - POST /api/matching/calculate/ - Calculate match between candidate and job
    - POST /api/matching/bulk-match/ - Match candidate with all active jobs
    - GET /api/matching/top-matches/{candidate_id}/ - Get top job matches for candidate
    - GET /api/matching/top-candidates/{job_id}/ - Get top candidates for job
    """
    
    permission_classes = [AllowAny]  # Change to IsAuthenticated for production
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.matcher = CandidateJobMatcher()
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Calculate match score between a candidate and job
        
        POST /api/matching/calculate/
        Body: {
            "candidate_id": 1,
            "job_id": 5
        }
        
        Returns: Complete matching analysis
        """
        
        candidate_id = request.data.get('candidate_id')
        job_id = request.data.get('job_id')
        
        if not candidate_id or not job_id:
            return Response(
                {'error': 'Both candidate_id and job_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            candidate = Candidate.objects.get(id=candidate_id)
            job = Job.objects.get(id=job_id)
        except (Candidate.DoesNotExist, Job.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prepare data for matching
        candidate_data = {
            'parsed_skills': candidate.parsed_skills or [],
            'parsed_experience_years': candidate.parsed_experience_years or 0,
            'parsed_education': candidate.parsed_education or [],
            'parsed_location': candidate.parsed_location or '',
            'professional_summary': candidate.professional_summary or '',
            'parsed_experience': candidate.parsed_experience or []
        }
        
        job_data = {
            'parsed_required_skills': job.parsed_required_skills or [],
            'parsed_preferred_skills': job.parsed_preferred_skills or [],
            'min_experience_years': job.min_experience_years or 0,
            'max_experience_years': job.max_experience_years or 50,
            'parsed_qualifications': job.parsed_qualifications or [],
            'location': job.location or '',
            'is_remote': job.is_remote,
            'description': job.description or '',
            'requirements': job.requirements or ''
        }
        
        # Calculate match
        match_result = self.matcher.calculate_match(candidate_data, job_data)
        
        # Update or create application with match score
        application, created = JobApplication.objects.get_or_create(
            candidate=candidate,
            job=job,
            defaults={
                'match_score': match_result['overall_score'],
                'match_details': match_result
            }
        )
        
        if not created:
            application.match_score = match_result['overall_score']
            application.match_details = match_result
            application.save()
        
        return Response({
            'candidate': {
                'id': candidate.id,
                'name': candidate.full_name,
                'email': candidate.email
            },
            'job': {
                'id': job.id,
                'title': job.title,
                'company': job.company_name
            },
            'match_result': match_result,
            'application_id': application.id
        })
    
    @action(detail=False, methods=['post'])
    def bulk_match(self, request):
        """
        Match a candidate with all active jobs
        
        POST /api/matching/bulk-match/
        Body: {
            "candidate_id": 1,
            "top_n": 10  (optional, default 10)
        }
        
        Returns: Top N job matches sorted by score
        """
        
        candidate_id = request.data.get('candidate_id')
        top_n = request.data.get('top_n', 10)
        
        if not candidate_id:
            return Response(
                {'error': 'candidate_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all active jobs
        active_jobs = Job.objects.filter(status='active')
        
        # Prepare candidate data once
        candidate_data = {
            'parsed_skills': candidate.parsed_skills or [],
            'parsed_experience_years': candidate.parsed_experience_years or 0,
            'parsed_education': candidate.parsed_education or [],
            'parsed_location': candidate.parsed_location or '',
            'professional_summary': candidate.professional_summary or '',
            'parsed_experience': candidate.parsed_experience or []
        }
        
        # Calculate matches for all jobs
        matches = []
        for job in active_jobs:
            job_data = {
                'parsed_required_skills': job.parsed_required_skills or [],
                'parsed_preferred_skills': job.parsed_preferred_skills or [],
                'min_experience_years': job.min_experience_years or 0,
                'max_experience_years': job.max_experience_years or 50,
                'parsed_qualifications': job.parsed_qualifications or [],
                'location': job.location or '',
                'is_remote': job.is_remote,
                'description': job.description or '',
                'requirements': job.requirements or ''
            }
            
            match_result = self.matcher.calculate_match(candidate_data, job_data)
            
            matches.append({
                'job_id': job.id,
                'job_title': job.title,
                'company': job.company_name,
                'location': job.location,
                'employment_type': job.employment_type,
                'is_remote': job.is_remote,
                'match_score': match_result['overall_score'],
                'match_level': match_result['match_level'],
                'matched_skills': match_result['matched_skills'][:5],
                'strengths': match_result['strengths'][:3]
            })
        
        # Sort by match score and return top N
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        top_matches = matches[:top_n]
        
        return Response({
            'candidate': {
                'id': candidate.id,
                'name': candidate.full_name,
                'email': candidate.email
            },
            'total_jobs_analyzed': len(matches),
            'top_matches': top_matches
        })
    
    @action(detail=False, methods=['get'], url_path='top-matches/(?P<candidate_id>[^/.]+)')
    def top_matches(self, request, candidate_id=None):
        """
        Get top job matches for a candidate
        
        GET /api/matching/top-matches/{candidate_id}/
        Query params:
        - limit: Number of results (default 10)
        - min_score: Minimum match score (default 50)
        """
        
        limit = int(request.query_params.get('limit', 10))
        min_score = float(request.query_params.get('min_score', 50))
        
        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get existing applications with match scores
        applications = JobApplication.objects.filter(
            candidate=candidate,
            match_score__gte=min_score
        ).select_related('job').order_by('-match_score')[:limit]
        
        matches = []
        for app in applications:
            matches.append({
                'job_id': app.job.id,
                'job_title': app.job.title,
                'company': app.job.company_name,
                'location': app.job.location,
                'match_score': float(app.match_score),
                'match_details': app.match_details,
                'application_status': app.status,
                'applied_at': app.applied_at
            })
        
        return Response({
            'candidate': {
                'id': candidate.id,
                'name': candidate.full_name
            },
            'matches': matches
        })
    
    @action(detail=False, methods=['get'], url_path='top-candidates/(?P<job_id>[^/.]+)')
    def top_candidates(self, request, job_id=None):
        """
        Get top candidate matches for a job
        
        GET /api/matching/top-candidates/{job_id}/
        Query params:
        - limit: Number of results (default 20)
        - min_score: Minimum match score (default 60)
        - status: Filter by application status
        """
        
        limit = int(request.query_params.get('limit', 20))
        min_score = float(request.query_params.get('min_score', 60))
        status_filter = request.query_params.get('status', None)
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get applications for this job
        applications = JobApplication.objects.filter(
            job=job,
            match_score__gte=min_score
        ).select_related('candidate')
        
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        applications = applications.order_by('-match_score')[:limit]
        
        candidates = []
        for app in applications:
            candidates.append({
                'candidate_id': app.candidate.id,
                'name': app.candidate.full_name,
                'email': app.candidate.email,
                'phone': app.candidate.phone_number,
                'location': app.candidate.parsed_location,
                'experience_years': app.candidate.parsed_experience_years,
                'skills': app.candidate.parsed_skills[:10],
                'match_score': float(app.match_score),
                'match_details': app.match_details,
                'application_status': app.status,
                'applied_at': app.applied_at,
                'application_id': app.id
            })
        
        return Response({
            'job': {
                'id': job.id,
                'title': job.title,
                'company': job.company_name
            },
            'total_applicants': JobApplication.objects.filter(job=job).count(),
            'top_candidates': candidates
        })
    
    @action(detail=False, methods=['post'])
    def auto_match_application(self, request):
        """
        Automatically calculate match when candidate applies to a job
        This should be called after application is created
        
        POST /api/matching/auto-match-application/
        Body: {
            "application_id": 5
        }
        """
        
        application_id = request.data.get('application_id')
        
        if not application_id:
            return Response(
                {'error': 'application_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            application = JobApplication.objects.select_related(
                'candidate', 'job'
            ).get(id=application_id)
        except JobApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        candidate = application.candidate
        job = application.job
        
        # Prepare data
        candidate_data = {
            'parsed_skills': candidate.parsed_skills or [],
            'parsed_experience_years': candidate.parsed_experience_years or 0,
            'parsed_education': candidate.parsed_education or [],
            'parsed_location': candidate.parsed_location or '',
            'professional_summary': candidate.professional_summary or '',
            'parsed_experience': candidate.parsed_experience or []
        }
        
        job_data = {
            'parsed_required_skills': job.parsed_required_skills or [],
            'parsed_preferred_skills': job.parsed_preferred_skills or [],
            'min_experience_years': job.min_experience_years or 0,
            'max_experience_years': job.max_experience_years or 50,
            'parsed_qualifications': job.parsed_qualifications or [],
            'location': job.location or '',
            'is_remote': job.is_remote,
            'description': job.description or '',
            'requirements': job.requirements or ''
        }
        
        # Calculate match
        match_result = self.matcher.calculate_match(candidate_data, job_data)
        
        # Update application
        application.match_score = match_result['overall_score']
        application.match_details = match_result
        application.save()
        
        return Response({
            'message': 'Match calculated successfully',
            'application_id': application.id,
            'match_score': match_result['overall_score'],
            'match_level': match_result['match_level']
        })


# Add these to jobs/urls.py
"""
from .matching_views import MatchingViewSet

router.register(r'matching', MatchingViewSet, basename='matching')
"""