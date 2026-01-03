"""
Enhanced Candidate model with comprehensive resume data fields.
"""
import os
from django.db import models
from django.core.validators import FileExtensionValidator


def resume_upload_path(instance, filename):
    """Generate upload path for resume files."""
    from datetime import datetime
    date_path = datetime.now().strftime('%Y/%m/%d')
    email_prefix = instance.email.split('@')[0]
    return f'resumes/{date_path}/{email_prefix}_{filename}'


class Candidate(models.Model):
    """
    Enhanced Candidate model with comprehensive parsed resume data.
    """
    
    # Personal Information
    full_name = models.CharField(
        max_length=255,
        help_text="Candidate's full name"
    )
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
    
    # Resume File
    resume = models.FileField(
        upload_to=resume_upload_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'docx', 'txt', 'doc']
            )
        ],
        help_text="Resume file"
    )
    
    # Parsed Resume Data - Basic Info
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
    
    # Parsed Resume Data - Professional Links
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
        help_text="Other professional links (Twitter, Stack Overflow, etc.)"
    )
    
    # Parsed Resume Data - Skills & Expertise
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
    
    # Parsed Resume Data - Experience
    parsed_experience = models.JSONField(
        default=list,
        blank=True,
        help_text="Work experience entries"
    )
    parsed_total_experience_years = models.FloatField(
        blank=True,
        null=True,
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
    
    # Parsed Resume Data - Education
    parsed_education = models.JSONField(
        default=list,
        blank=True,
        help_text="Education history"
    )
    parsed_highest_degree = models.CharField(
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
    
    # Parsed Resume Data - Certifications
    parsed_certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Professional certifications"
    )
    
    # Parsed Resume Data - Projects
    parsed_projects = models.JSONField(
        default=list,
        blank=True,
        help_text="Notable projects"
    )
    
    # Parsed Resume Data - Additional
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
    
    # Metadata
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
        return f"{self.full_name} ({self.email})"
    
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
            'linkedin': self.parsed_linkedin,
            'github': self.parsed_github,
            'portfolio': self.parsed_portfolio,
            'other_links': self.parsed_other_links,
        }
    
    def get_all_skills(self):
        """Get all skills, languages, frameworks, and tools."""
        return {
            'skills': self.parsed_skills,
            'languages': self.parsed_languages,
            'frameworks': self.parsed_frameworks,
            'tools': self.parsed_tools,
        }