from rest_framework import serializers
from .models import Job, JobApplication
from candidates.models import Candidate
from candidates.serializers import CandidateSerializer

class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for Job model
    Handles creation, update, and automatic parsing
    """
    
    # Read-only computed fields
    salary_range_display = serializers.ReadOnlyField()
    experience_range_display = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id',
            'job_id',
            'title',
            'company_name',
            'department',
            'description',
            'responsibilities',
            'requirements',
            'nice_to_have',
            'employment_type',
            'experience_level',
            'min_experience_years',
            'max_experience_years',
            'location',
            'is_remote',
            'remote_type',
            'salary_min',
            'salary_max',
            'salary_currency',
            'salary_period',
            'parsed_required_skills',
            'parsed_preferred_skills',
            'parsed_qualifications',
            'parsed_responsibilities',
            'parsed_benefits',
            'application_deadline',
            'max_applications',
            'status',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
            'published_at',
            'view_count',
            'application_count',
            'keywords',
            'salary_range_display',
            'experience_range_display',
            'is_active',
        ]
        read_only_fields = [
            'id',
            'job_id',
            'created_at',
            'updated_at',
            'published_at',
            'view_count',
            'application_count',
        ]
    
    def create(self, validated_data):
        """Create job with automatic parsing"""
        from .utils.job_parser import JobDescriptionParser
        
        # Parse job description
        parser = JobDescriptionParser()
        parsed_data = parser.parse_job_description(
            description=validated_data.get('description', ''),
            requirements=validated_data.get('requirements', ''),
            nice_to_have=validated_data.get('nice_to_have', '')
        )
        
        # Add parsed data to validated_data
        for key, value in parsed_data.items():
            if key not in validated_data or not validated_data.get(key):
                validated_data[key] = value
        
        # Create job
        job = Job.objects.create(**validated_data)
        return job
    
    def update(self, instance, validated_data):
        """Update job and re-parse if description changed"""
        from .utils.job_parser import JobDescriptionParser
        
        # Check if description, requirements, or nice_to_have changed
        description_changed = (
            validated_data.get('description') != instance.description or
            validated_data.get('requirements') != instance.requirements or
            validated_data.get('nice_to_have') != instance.nice_to_have
        )
        
        # If description changed, re-parse
        if description_changed:
            parser = JobDescriptionParser()
            parsed_data = parser.parse_job_description(
                description=validated_data.get('description', instance.description),
                requirements=validated_data.get('requirements', instance.requirements),
                nice_to_have=validated_data.get('nice_to_have', instance.nice_to_have)
            )
            
            # Update parsed fields
            for key, value in parsed_data.items():
                validated_data[key] = value
        
        # Update instance
        for key, value in validated_data.items():
            setattr(instance, key, value)
        
        instance.save()
        return instance


class JobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for job listings
    """
    
    salary_range_display = serializers.ReadOnlyField()
    experience_range_display = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'job_id',
            'title',
            'company_name',
            'department',
            'employment_type',
            'experience_level',
            'location',
            'is_remote',
            'remote_type',
            'salary_range_display',
            'experience_range_display',
            'status',
            'is_active',
            'application_deadline',
            'view_count',
            'application_count',
            'created_at',
            'published_at',
        ]


class JobApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for JobApplication model
    """
    
    # Nested serializers for read operations
    job_details = JobListSerializer(source='job', read_only=True)
    candidate_details = CandidateSerializer(source='candidate', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id',
            'job',
            'job_details',
            'candidate',
            'candidate_details',
            'status',
            'cover_letter',
            'match_score',
            'match_details',
            'screening_notes',
            'screening_score',
            'interview_date',
            'interview_notes',
            'interview_score',
            'reviewed_by',
            'reviewed_by_username',
            'reviewed_at',
            'applied_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at', 'reviewed_at']
    
    def create(self, validated_data):
        """Create application and increment job application count"""
        application = JobApplication.objects.create(**validated_data)
        
        # Increment job application count
        application.job.increment_application_count()
        
        return application


class JobApplicationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating job applications
    Simplified - only requires job_id and candidate_id
    """
    
    job_id = serializers.IntegerField()
    candidate_id = serializers.IntegerField()
    cover_letter = serializers.CharField(required=False, allow_blank=True)
    
    def validate_job_id(self, value):
        """Validate job exists and is active"""
        try:
            job = Job.objects.get(id=value)
            if not job.is_active:
                raise serializers.ValidationError("This job is no longer accepting applications.")
            return value
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found.")
    
    def validate_candidate_id(self, value):
        """Validate candidate exists"""
        try:
            Candidate.objects.get(id=value)
            return value
        except Candidate.DoesNotExist:
            raise serializers.ValidationError("Candidate not found.")
    
    def validate(self, data):
        """Check for duplicate applications"""
        job_id = data.get('job_id')
        candidate_id = data.get('candidate_id')
        
        if JobApplication.objects.filter(job_id=job_id, candidate_id=candidate_id).exists():
            raise serializers.ValidationError(
                "You have already applied for this position."
            )
        
        return data
    
    def create(self, validated_data):
        """Create the job application"""
        application = JobApplication.objects.create(
            job_id=validated_data['job_id'],
            candidate_id=validated_data['candidate_id'],
            cover_letter=validated_data.get('cover_letter', ''),
            status='applied'
        )
        
        # Increment job application count
        application.job.increment_application_count()
        
        return application


class JobStatsSerializer(serializers.Serializer):
    """
    Serializer for job statistics
    """
    
    total_jobs = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    avg_applications_per_job = serializers.FloatField()
    top_viewed_jobs = JobListSerializer(many=True)
    recent_jobs = JobListSerializer(many=True)