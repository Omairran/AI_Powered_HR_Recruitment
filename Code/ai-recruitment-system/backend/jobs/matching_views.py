"""
API Views for Candidate-Job Matching
Provides endpoints for calculating matches, ranking candidates, and bulk operations.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Job, JobApplication
from candidates.models import Candidate
from .utils.matching_engine import CandidateJobMatcher
from .serializers import JobSerializer, JobApplicationSerializer
from candidates.serializers import CandidateSerializer


class MatchingViewSet(viewsets.ViewSet):
    """
    ViewSet for handling matching operations between candidates and jobs.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.matcher = CandidateJobMatcher()
    
    def _prepare_candidate_data(self, candidate):
        """Extract relevant data from candidate model."""
        return {
            'parsed_skills': candidate.parsed_skills or [],
            'parsed_experience_years': candidate.parsed_experience_years or 0,
            'parsed_education_level': candidate.parsed_education_level or '',
            'parsed_location': candidate.parsed_location or '',
            'parsed_summary': candidate.parsed_summary or '',
        }
    
    def _prepare_job_data(self, job):
        """Extract relevant data from job model."""
        return {
            'parsed_required_skills': job.parsed_required_skills or [],
            'parsed_preferred_skills': job.parsed_preferred_skills or [],
            'parsed_min_experience': job.parsed_min_experience or 0,
            'parsed_max_experience': job.parsed_max_experience or 100,
            'parsed_education_level': job.parsed_education_level or '',
            'parsed_location': job.parsed_location or '',
            'parsed_is_remote': job.parsed_is_remote or False,
            'parsed_description': job.parsed_description or '',
            'parsed_responsibilities': job.parsed_responsibilities or '',
        }
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Calculate match score between a specific candidate and job.
        
        POST /api/matching/calculate/
        Body: {
            "candidate_id": 1,
            "job_id": 1
        }
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
        candidate_data = self._prepare_candidate_data(candidate)
        job_data = self._prepare_job_data(job)
        
        # Calculate match
        match_result = self.matcher.calculate_match(candidate_data, job_data)
        
        # Try to update existing application or create note
        try:
            application = JobApplication.objects.get(
                candidate=candidate,
                job=job
            )
            application.match_score = match_result['overall_score']
            application.match_details = match_result
            application.save()
        except JobApplication.DoesNotExist:
            pass  # No application exists yet
        
        return Response({
            'candidate': {
                'id': candidate.id,
                'name': candidate.name,
                'email': candidate.email
            },
            'job': {
                'id': job.id,
                'title': job.title,
                'company': job.company
            },
            'match_result': match_result
        })
    
    @action(detail=False, methods=['get'], url_path='top-candidates/(?P<job_id>\d+)')
    def top_candidates(self, request, job_id=None):
        """
        Get top matching candidates for a specific job.
        
        GET /api/matching/top-candidates/{job_id}/?min_score=60&limit=10
        """
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        min_score = float(request.query_params.get('min_score', 0))
        limit = int(request.query_params.get('limit', 50))
        
        # Get all applications for this job
        applications = JobApplication.objects.filter(job=job).select_related('candidate')
        
        # Calculate matches for applications without scores
        job_data = self._prepare_job_data(job)
        
        for application in applications:
            if application.match_score is None:
                candidate_data = self._prepare_candidate_data(application.candidate)
                match_result = self.matcher.calculate_match(candidate_data, job_data)
                application.match_score = match_result['overall_score']
                application.match_details = match_result
                application.save()
        
        # Filter and sort
        top_applications = applications.filter(
            match_score__gte=min_score
        ).order_by('-match_score')[:limit]
        
        results = []
        for app in top_applications:
            results.append({
                'application_id': app.id,
                'candidate': CandidateSerializer(app.candidate).data,
                'match_score': app.match_score,
                'match_details': app.match_details,
                'applied_at': app.applied_at,
                'status': app.status
            })
        
        return Response({
            'job': JobSerializer(job).data,
            'total_applications': applications.count(),
            'matching_candidates': len(results),
            'candidates': results
        })
    
    @action(detail=False, methods=['post'])
    def bulk_match(self, request):
        """
        Match a candidate against all active jobs and return top matches.
        
        POST /api/matching/bulk-match/
        Body: {
            "candidate_id": 1,
            "top_n": 10
        }
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
        
        candidate_data = self._prepare_candidate_data(candidate)
        matches = []
        
        # Calculate match for each job
        for job in active_jobs:
            job_data = self._prepare_job_data(job)
            match_result = self.matcher.calculate_match(candidate_data, job_data)
            
            matches.append({
                'job': JobSerializer(job).data,
                'match_score': match_result['overall_score'],
                'match_details': match_result
            })
        
        # Sort by score and return top N
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        top_matches = matches[:top_n]
        
        return Response({
            'candidate': CandidateSerializer(candidate).data,
            'total_jobs_analyzed': len(matches),
            'top_matches': top_matches
        })
    
    @action(detail=True, methods=['post'])
    def recalculate_job(self, request, pk=None):
        """
        Recalculate match scores for all applications of a specific job.
        
        POST /api/matching/recalculate-job/{job_id}/
        """
        try:
            job = Job.objects.get(id=pk)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        applications = JobApplication.objects.filter(job=job).select_related('candidate')
        job_data = self._prepare_job_data(job)
        
        updated_count = 0
        for application in applications:
            candidate_data = self._prepare_candidate_data(application.candidate)
            match_result = self.matcher.calculate_match(candidate_data, job_data)
            
            application.match_score = match_result['overall_score']
            application.match_details = match_result
            application.save()
            updated_count += 1
        
        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'applications_updated': updated_count,
            'message': f'Successfully recalculated {updated_count} application matches'
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get overall matching statistics.
        
        GET /api/matching/statistics/
        """
        total_applications = JobApplication.objects.count()
        matched_applications = JobApplication.objects.filter(
            match_score__isnull=False
        ).count()
        
        # Count total unique candidates
        total_candidates = Candidate.objects.count()
        
        excellent_matches = JobApplication.objects.filter(
            match_score__gte=90
        ).count()
        
        great_matches = JobApplication.objects.filter(
            match_score__gte=75,
            match_score__lt=90
        ).count()
        
        good_matches = JobApplication.objects.filter(
            match_score__gte=60,
            match_score__lt=75
        ).count()
        
        fair_matches = JobApplication.objects.filter(
            match_score__gte=45,
            match_score__lt=60
        ).count()
        
        poor_matches = JobApplication.objects.filter(
            match_score__lt=45,
            match_score__isnull=False
        ).count()
        
        return Response({
            'total_applications': total_applications,
            'matched_applications': matched_applications,
            'total_candidates': total_candidates,  # ADDED: Total unique candidates
            'total_matches': matched_applications, # ADDED: Alias for frontend compatibility
            'unmatched_applications': total_applications - matched_applications,
            'match_distribution': {
                'excellent': excellent_matches,  # 90-100%
                'great': great_matches,          # 75-89%
                'good': good_matches,            # 60-74%
                'fair': fair_matches,            # 45-59%
                'poor': poor_matches             # 0-44%
            }
        })