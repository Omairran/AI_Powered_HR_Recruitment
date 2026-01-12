from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Count, Avg
from django.utils import timezone

from .models import Job, JobApplication
from .serializers import (
    JobSerializer, 
    JobListSerializer, 
    JobApplicationSerializer,
    JobApplicationCreateSerializer,
    JobStatsSerializer
)

class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job CRUD operations
    
    Endpoints:
    - GET /api/jobs/ - List all jobs
    - POST /api/jobs/ - Create new job
    - GET /api/jobs/{id}/ - Get job details
    - PATCH /api/jobs/{id}/ - Update job
    - DELETE /api/jobs/{id}/ - Delete job
    - GET /api/jobs/active/ - List active jobs only
    - GET /api/jobs/{id}/applications/ - Get applications for job
    - POST /api/jobs/{id}/publish/ - Publish a draft job
    - POST /api/jobs/{id}/close/ - Close an active job
    """
    
    queryset = Job.objects.all()
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list' or self.action == 'active':
            return JobListSerializer
        return JobSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view jobs, but require authentication to create/update
        """
        if self.action in ['list', 'retrieve', 'active']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Filter jobs based on query parameters
        """
        queryset = Job.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by employment type
        employment_type = self.request.query_params.get('employment_type', None)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by remote
        is_remote = self.request.query_params.get('is_remote', None)
        if is_remote is not None:
            queryset = queryset.filter(is_remote=is_remote.lower() == 'true')
        
        # Search by title or company
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by skills (searches in parsed_required_skills JSON field)
        skills = self.request.query_params.get('skills', None)
        if skills:
            skill_list = [s.strip() for s in skills.split(',')]
            for skill in skill_list:
                queryset = queryset.filter(parsed_required_skills__icontains=skill)
        
        return queryset.distinct()
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve job details and increment view count
        """
        instance = self.get_object()
        instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Set created_by to current user when creating job
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get all active jobs
        GET /api/jobs/active/
        """
        active_jobs = self.get_queryset().filter(status='active')
        
        # Additional filter: only jobs that can accept applications
        active_jobs = [job for job in active_jobs if job.is_active]
        
        serializer = self.get_serializer(active_jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """
        Get all applications for a specific job
        GET /api/jobs/{id}/applications/
        
        Query params:
        - status: Filter by application status
        - sort_by: 'match_score', 'applied_at', 'status'
        """
        job = self.get_object()
        applications = JobApplication.objects.filter(job=job)
        
        # Filter by status
        status_filter = request.query_params.get('status', None)
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        # Sort applications
        sort_by = request.query_params.get('sort_by', '-applied_at')
        valid_sort_fields = ['match_score', 'applied_at', 'status', '-match_score', '-applied_at']
        if sort_by in valid_sort_fields:
            applications = applications.order_by(sort_by)
        
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish a draft job
        POST /api/jobs/{id}/publish/
        """
        job = self.get_object()
        
        if job.status != 'draft':
            return Response(
                {'error': 'Only draft jobs can be published.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job.status = 'active'
        job.published_at = timezone.now()
        job.save()
        
        serializer = self.get_serializer(job)
        return Response({
            'message': 'Job published successfully!',
            'job': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Close an active job
        POST /api/jobs/{id}/close/
        """
        job = self.get_object()
        
        if job.status not in ['active', 'on_hold']:
            return Response(
                {'error': 'Only active or on-hold jobs can be closed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job.status = 'closed'
        job.save()
        
        serializer = self.get_serializer(job)
        return Response({
            'message': 'Job closed successfully!',
            'job': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get job statistics
        GET /api/jobs/stats/
        """
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status='active').count()
        total_applications = JobApplication.objects.count()
        
        avg_applications = JobApplication.objects.values('job').annotate(
            count=Count('id')
        ).aggregate(avg=Avg('count'))['avg'] or 0
        
        top_viewed = Job.objects.order_by('-view_count')[:5]
        recent_jobs = Job.objects.order_by('-created_at')[:5]
        
        stats_data = {
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'avg_applications_per_job': round(avg_applications, 2),
            'top_viewed_jobs': JobListSerializer(top_viewed, many=True).data,
            'recent_jobs': JobListSerializer(recent_jobs, many=True).data,
        }
        
        return Response(stats_data)


class JobApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for JobApplication CRUD operations
    
    Endpoints:
    - GET /api/job-applications/ - List all applications
    - POST /api/job-applications/ - Create new application
    - GET /api/job-applications/{id}/ - Get application details
    - PATCH /api/job-applications/{id}/ - Update application
    - DELETE /api/job-applications/{id}/ - Delete application
    - POST /api/job-applications/{id}/update_status/ - Update application status
    """
    
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    
    def get_permissions(self):
        """Allow anyone to create applications"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Filter applications based on query parameters
        """
        queryset = JobApplication.objects.all()
        
        # Filter by job
        job_id = self.request.query_params.get('job_id', None)
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        
        # Filter by candidate
        candidate_id = self.request.query_params.get('candidate_id', None)
        if candidate_id:
            queryset = queryset.filter(candidate_id=candidate_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Sort by match score
        sort_by = self.request.query_params.get('sort_by', '-applied_at')
        if sort_by == 'match_score':
            queryset = queryset.order_by('-match_score', '-applied_at')
        elif sort_by == '-match_score':
            queryset = queryset.order_by('match_score', '-applied_at')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create new job application
        """
        serializer = JobApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        
        # Return full application details
        output_serializer = JobApplicationSerializer(application)
        return Response({
            'message': 'Application submitted successfully!',
            'application': output_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update application status
        POST /api/job-applications/{id}/update_status/
        
        Body: {
            "status": "shortlisted",
            "notes": "Great candidate"
        }
        """
        application = self.get_object()
        
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'Status is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in JobApplication.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        application.status = new_status
        
        # Update notes if provided
        notes = request.data.get('notes')
        if notes:
            application.screening_notes = notes
        
        # Set reviewed_by
        if request.user.is_authenticated:
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
        
        application.save()
        
        serializer = self.get_serializer(application)
        return Response({
            'message': 'Application status updated successfully!',
            'application': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        """
        Get applications for a specific candidate by email
        GET /api/job-applications/my_applications/?email=candidate@example.com
        """
        email = request.query_params.get('email')
        if not email:
            return Response(
                {'error': 'Email parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from candidates.models import Candidate
        try:
            candidate = Candidate.objects.get(email=email)
            applications = JobApplication.objects.filter(candidate=candidate)
            serializer = self.get_serializer(applications, many=True)
            return Response(serializer.data)
        except Candidate.DoesNotExist:
            return Response([])