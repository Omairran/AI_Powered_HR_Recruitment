from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Job, JobApplication
from .serializers import JobSerializer, JobApplicationSerializer


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job CRUD operations
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view jobs, but only authenticated HR users can create/update
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        """Filter jobs based on query parameters"""
        queryset = Job.objects.all()
        
        # Filter by status (default to active for public viewing)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        elif not self.request.user.is_authenticated:
            # Non-authenticated users only see active jobs
            queryset = queryset.filter(status='active')
        
        # Filter by job type
        job_type = self.request.query_params.get('job_type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Filter by experience level
        experience_level = self.request.query_params.get('experience_level', None)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        
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
                Q(company__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create a new job posting"""
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to post jobs'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is HR
        if hasattr(request.user, 'user_type') and request.user.user_type != 'hr':
            return Response(
                {'error': 'Only HR users can post jobs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate and create the job
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            return Response(
                {
                    'message': 'Job posted successfully!',
                    'job': serializer.data
                },
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            print(f"Error creating job: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update a job posting"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if hasattr(request.user, 'user_type') and request.user.user_type != 'hr':
            return Response(
                {'error': 'Only HR users can update jobs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active jobs"""
        active_jobs = Job.objects.filter(status='active').order_by('-created_at')
        serializer = self.get_serializer(active_jobs, many=True)
        return Response(serializer.data)


class JobApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for JobApplication CRUD operations
    """
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filter applications based on user and query params"""
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
        
        # If user is authenticated and is a candidate, show only their applications
        if self.request.user.is_authenticated:
            if hasattr(self.request.user, 'user_type') and self.request.user.user_type == 'candidate':
                try:
                    candidate = self.request.user.candidate_profile
                    queryset = queryset.filter(candidate=candidate)
                except:
                    pass
        
        return queryset.select_related('candidate', 'job').order_by('-match_score', '-applied_at')
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update application status
        PATCH /api/job-applications/{id}/update_status/
        Body: {"status": "shortlisted"}
        """
        application = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in JobApplication.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = new_status
        application.save()
        
        serializer = self.get_serializer(application)
        return Response({
            'message': 'Status updated successfully',
            'application': serializer.data
        })