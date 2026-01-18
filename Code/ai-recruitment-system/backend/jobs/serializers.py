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
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'job_type',
            'experience_level',
            'salary_min',
            'salary_max',
            'description',
            'requirements',
            'responsibilities',
            'benefits',
            'skills_required',
            'skills_preferred',
            'min_experience',
            'max_experience',
            'education_level',
            'is_remote',
            'application_deadline',
            'parsed_required_skills',
            'parsed_preferred_skills',
            'parsed_min_experience',
            'parsed_max_experience',
            'parsed_education_level',
            'parsed_location',
            'parsed_is_remote',
            'parsed_description',
            'parsed_responsibilities',
            'status',
            'created_at',
            'updated_at',
            'applications_count',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'parsed_required_skills',
            'parsed_preferred_skills',
            'parsed_min_experience',
            'parsed_max_experience',
            'parsed_education_level',
            'parsed_location',
            'parsed_is_remote',
            'parsed_description',
            'parsed_responsibilities',
        ]
    
    def get_applications_count(self, obj):
        """Get count of applications for this job"""
        return obj.applications.count()
    
    def create(self, validated_data):
        """Create job - parsing happens in model's save() method"""
        job = Job.objects.create(**validated_data)
        return job
    
    def update(self, instance, validated_data):
        """Update job - parsing happens in model's save() method"""
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class JobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for job listings
    """
    
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'job_type',
            'experience_level',
            'salary_min',
            'salary_max',
            'is_remote',
            'status',
            'application_deadline',
            'applications_count',
            'created_at',
        ]
    
    def get_applications_count(self, obj):
        """Get count of applications for this job"""
        return obj.applications.count()


class JobApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for JobApplication model
    """
    
    # Nested serializers for read operations
    job_details = JobListSerializer(source='job', read_only=True)
    candidate_details = CandidateSerializer(source='candidate', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id',
            'job',
            'job_details',
            'job_title',
            'candidate',
            'candidate_details',
            'candidate_name',
            'status',
            'cover_letter',
            'notes',
            'match_score',
            'match_details',
            'applied_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']
    
    def create(self, validated_data):
        """Create application"""
        application = JobApplication.objects.create(**validated_data)
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
            if job.status != 'active':
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
        
        return application


class JobStatsSerializer(serializers.Serializer):
    """
    Serializer for job statistics
    """
    
    total_jobs = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    avg_applications_per_job = serializers.FloatField()
    top_viewed_jobs = JobListSerializer(many=True, required=False)
    recent_jobs = JobListSerializer(many=True, required=False)