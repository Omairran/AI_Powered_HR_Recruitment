"""
Enhanced Candidate model with comprehensive resume data fields and User authentication.
"""
import os
from django.db import models
from django.core.validators import FileExtensionValidator
from django.contrib.auth.models import AbstractUser
from datetime import datetime


# ============================================================================
# CUSTOM USER MODEL
# ============================================================================

class User(AbstractUser):
    """
    Custom User model with role-based access (Candidate or HR)
    """
    USER_TYPE_CHOICES = (
        ('candidate', 'Candidate'),
        ('hr', 'HR Recruiter'),
    )
    
    user_type = models.CharField(
        max_length=20, 
        choices=USER_TYPE_CHOICES, 
        default='candidate',
        help_text="User type: Candidate or HR Recruiter"
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Phone number"
    )
    company = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Company name (for HR users)"
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def resume_upload_path(instance, filename):
    """Generate upload path for resume files."""
    date_path = datetime.now().strftime('%Y/%m/%d')
    email_prefix = instance.email.split('@')[0]
    return f'resumes/{date_path}/{email_prefix}_{filename}'


# ============================================================================
# CANDIDATE MODEL
# ============================================================================

class Candidate(models.Model):
    """
    Enhanced Candidate model with comprehensive parsed resume data.
    Links to User model for authentication.
    """
    
    # ========================================================================
    # User Relationship
    # ========================================================================
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='candidate_profile',
        null=True,
        blank=True,
        help_text="Linked user account"
    )
    
    # ========================================================================
    # Personal Information
    # ========================================================================
    
    name = models.CharField(max_length=255, help_text="Candidate's full name")
    
    email = models.EmailField(
        unique=True,
        help_text="Candidate's email address"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Candidate's phone number"
    )
    
    # ========================================================================
    # Resume File
    # ========================================================================
    resume = models.FileField(
        upload_to=resume_upload_path,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'docx', 'txt', 'doc']
            )
        ],
        help_text="Resume file (PDF, DOCX, TXT, DOC)"
    )
    
    # ========================================================================
    # Parsed Resume Data - Basic Info
    # ========================================================================
    parsed_text = models.TextField(
        blank=True,
        null=True,
        help_text="Raw extracted text from resume"
    )
    parsed_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name extracted from resume"
    )
    parsed_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email extracted from resume"
    )
    parsed_phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Phone number extracted from resume"
    )
    
    # ========================================================================
    # Parsed Resume Data - Professional Links
    # ========================================================================
    parsed_linkedin = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="LinkedIn profile URL"
    )
    parsed_github = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="GitHub profile URL"
    )
    parsed_portfolio = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Portfolio/personal website URL"
    )
    parsed_other_links = models.JSONField(
        default=list,
        blank=True,
        help_text="Other professional links"
    )
    
    # ========================================================================
    # Parsed Resume Data - Skills & Expertise
    # ========================================================================
    parsed_skills = models.JSONField(
        default=list,
        blank=True,
        help_text="Technical and professional skills"
    )
    parsed_languages = models.JSONField(
        default=list,
        blank=True,
        help_text="Programming languages"
    )
    parsed_frameworks = models.JSONField(
        default=list,
        blank=True,
        help_text="Frameworks and libraries"
    )
    parsed_tools = models.JSONField(
        default=list,
        blank=True,
        help_text="Tools and technologies"
    )
    parsed_soft_skills = models.JSONField(
        default=list,
        blank=True,
        help_text="Soft skills (Communication, Leadership, etc.)"
    )
    
    # ========================================================================
    # Parsed Resume Data - Experience
    # ========================================================================
    parsed_experience = models.JSONField(
        default=list,
        blank=True,
        help_text="Work experience entries"
    )
    parsed_experience_years = models.FloatField(
        default=0,
        blank=True,
        help_text="Total years of experience"
    )
    parsed_current_position = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Current or most recent position"
    )
    parsed_current_company = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Current or most recent company"
    )
    
    # ========================================================================
    # Parsed Resume Data - Education
    # ========================================================================
    parsed_education = models.JSONField(
        default=list,
        blank=True,
        help_text="Education history"
    )
    parsed_education_level = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Highest degree obtained"
    )
    parsed_university = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Most recent university/institution"
    )
    
    # ========================================================================
    # Parsed Resume Data - Certifications & Projects
    # ========================================================================
    parsed_certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Professional certifications"
    )
    parsed_projects = models.JSONField(
        default=list,
        blank=True,
        help_text="Notable projects"
    )
    
    # ========================================================================
    # Parsed Resume Data - Additional
    # ========================================================================
    parsed_summary = models.TextField(
        blank=True,
        null=True,
        help_text="Professional summary/objective"
    )
    parsed_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Location/Address"
    )
    
    # ========================================================================
    # Additional Profile Fields
    # ========================================================================
    linkedin_url = models.URLField(
        blank=True,
        null=True,
        help_text="LinkedIn profile (user-provided)"
    )
    portfolio_url = models.URLField(
        blank=True,
        null=True,
        help_text="Portfolio website (user-provided)"
    )
    
    # ========================================================================
    # Metadata
    # ========================================================================
    application_status = models.CharField(
        max_length=50,
        default='applied',
        choices=[
            ('applied', 'Applied'),
            ('screening', 'Screening'),
            ('interview', 'Interview'),
            ('rejected', 'Rejected'),
            ('hired', 'Hired'),
        ],
        help_text="Current application status"
    )
    parsing_status = models.CharField(
        max_length=50,
        default='pending',
        choices=[
            ('pending', 'Pending'),
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('partial', 'Partial'),
        ],
        help_text="Resume parsing status"
    )
    parsing_error = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if parsing failed"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Application submission timestamp"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update timestamp"
    )
    
    # ========================================================================
    # Model Configuration
    # ========================================================================
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Candidate'
        verbose_name_plural = 'Candidates'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['application_status']),
            models.Index(fields=['parsing_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    def get_resume_filename(self):
        """Get the original filename of the resume."""
        if self.resume:
            return os.path.basename(self.resume.name)
        return None
    
    def get_resume_extension(self):
        """Get the file extension of the resume."""
        if self.resume:
            return os.path.splitext(self.resume.name)[1].lower()
        return None
    
    def get_all_contacts(self):
        """Get all contact information as a dictionary."""
        return {
            'email': self.parsed_email or self.email,
            'phone': self.parsed_phone or self.phone,
            'linkedin': self.parsed_linkedin or self.linkedin_url,
            'github': self.parsed_github,
            'portfolio': self.parsed_portfolio or self.portfolio_url,
            'other_links': self.parsed_other_links,
        }
    
    def get_all_skills(self):
        """Get all skills, languages, frameworks, and tools combined."""
        all_skills = []
        all_skills.extend(self.parsed_skills)
        all_skills.extend(self.parsed_languages)
        all_skills.extend(self.parsed_frameworks)
        all_skills.extend(self.parsed_tools)
        all_skills.extend(self.parsed_soft_skills)
        return list(set(all_skills))  # Remove duplicates
    
    def get_skills_breakdown(self):
        """Get skills categorized by type."""
        return {
            'skills': self.parsed_skills,
            'languages': self.parsed_languages,
            'frameworks': self.parsed_frameworks,
            'tools': self.parsed_tools,
            'soft_skills': self.parsed_soft_skills,
        }