"""
Enhanced serializers with comprehensive resume data fields.
"""
from rest_framework import serializers
from .models import Candidate


class CandidateSerializer(serializers.ModelSerializer):
    """
    Complete serializer with all parsed resume data.
    All parsed fields are writable for manual updates.
    """
    resume_filename = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    all_contacts = serializers.SerializerMethodField()
    all_skills = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'resume',
            'resume_filename',
            'resume_url',
            
            # Parsed basic info - NOW WRITABLE
            'parsed_text',
            'parsed_name',
            'parsed_email',
            'parsed_phone',
            
            # Parsed links - NOW WRITABLE
            'parsed_linkedin',
            'parsed_github',
            'parsed_portfolio',
            'parsed_other_links',
            
            # Parsed skills - NOW WRITABLE
            'parsed_skills',
            'parsed_languages',
            'parsed_frameworks',
            'parsed_tools',
            
            # Parsed experience - NOW WRITABLE
            'parsed_experience',
            'parsed_total_experience_years',
            'parsed_current_position',
            'parsed_current_company',
            
            # Parsed education - NOW WRITABLE
            'parsed_education',
            'parsed_highest_degree',
            'parsed_university',
            
            # Parsed additional - NOW WRITABLE
            'parsed_certifications',
            'parsed_projects',
            'parsed_summary',
            'parsed_location',
            
            # Metadata
            'application_status',
            'parsing_status',
            'parsing_error',
            'created_at',
            'updated_at',
            
            # Helper methods
            'all_contacts',
            'all_skills',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'resume_filename',
            'resume_url',
            'all_contacts',
            'all_skills',
        ]
    
    def get_resume_filename(self, obj):
        return obj.get_resume_filename()
    
    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None
    
    def get_all_contacts(self, obj):
        return obj.get_all_contacts()
    
    def get_all_skills(self, obj):
        return obj.get_all_skills()
    
    def validate_resume(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                "Resume file size cannot exceed 10MB."
            )
        
        allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
        file_ext = value.name.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Resume must be in one of these formats: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def validate_email(self, value):
        """
        Allow same email to reapply - we'll update existing record instead of creating new one.
        """
        value = value.lower()
        return value
    
    def validate_parsed_total_experience_years(self, value):
        """Validate experience years."""
        if value is not None:
            if value < 0 or value > 70:
                raise serializers.ValidationError(
                    "Experience years must be between 0 and 70."
                )
        return value


class CandidateListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing candidates.
    """
    resume_filename = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'resume_filename',
            'parsed_name',
            'parsed_current_position',
            'parsed_current_company',
            'parsed_total_experience_years',
            'parsed_highest_degree',
            'parsed_skills',
            'application_status',
            'parsing_status',
            'created_at',
        ]
    
    def get_resume_filename(self, obj):
        return obj.get_resume_filename()


class CandidateCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new candidate applications.
    """
    class Meta:
        model = Candidate
        fields = [
            'full_name',
            'email',
            'phone',
            'resume',
        ]
    
    def validate_resume(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                "Resume file size cannot exceed 10MB."
            )
        
        allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
        file_ext = value.name.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Resume must be in one of these formats: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def validate_email(self, value):
        value = value.lower()
        if Candidate.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A candidate with this email has already applied."
            )
        return value