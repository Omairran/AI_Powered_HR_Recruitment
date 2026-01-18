from django.db import models
from candidates.models import Candidate


class Job(models.Model):
    """Job posting model."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]
    
    JOB_TYPE_CHOICES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('lead', 'Lead/Principal'),
    ]
    
    # Basic Information
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES, default='full-time')
    experience_level = models.CharField(max_length=50, choices=EXPERIENCE_LEVEL_CHOICES, default='mid')
    
    # Salary
    salary_min = models.IntegerField(blank=True, null=True)
    salary_max = models.IntegerField(blank=True, null=True)
    
    # Job Details
    description = models.TextField()
    requirements = models.TextField()
    responsibilities = models.TextField()
    benefits = models.TextField(blank=True, null=True)
    
    # Skills
    skills_required = models.TextField(help_text="Comma-separated required skills")
    skills_preferred = models.TextField(blank=True, null=True, help_text="Comma-separated preferred skills")
    
    # Experience & Education
    min_experience = models.IntegerField(default=0, help_text="Minimum years of experience")
    max_experience = models.IntegerField(blank=True, null=True, help_text="Maximum years of experience")
    education_level = models.CharField(max_length=100)
    
    # Other
    is_remote = models.BooleanField(default=False)
    application_deadline = models.DateField(blank=True, null=True)
    
    # Parsed data for matching (auto-populated)
    parsed_required_skills = models.JSONField(default=list, blank=True)
    parsed_preferred_skills = models.JSONField(default=list, blank=True)
    parsed_min_experience = models.IntegerField(default=0, blank=True)
    parsed_max_experience = models.IntegerField(default=100, blank=True)
    parsed_education_level = models.CharField(max_length=255, blank=True, null=True)
    parsed_location = models.CharField(max_length=255, blank=True, null=True)
    parsed_is_remote = models.BooleanField(default=False, blank=True)
    parsed_description = models.TextField(blank=True, null=True)
    parsed_responsibilities = models.TextField(blank=True, null=True)
    
    # Status - DEFAULT TO ACTIVE
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """Override save to parse skills and other data."""
        # Parse required skills
        if self.skills_required:
            self.parsed_required_skills = [
                skill.strip() for skill in self.skills_required.split(',')
                if skill.strip()
            ]
        
        # Parse preferred skills
        if self.skills_preferred:
            self.parsed_preferred_skills = [
                skill.strip() for skill in self.skills_preferred.split(',')
                if skill.strip()
            ]
        
        # Set parsed values
        self.parsed_min_experience = self.min_experience
        self.parsed_max_experience = self.max_experience or 100
        self.parsed_education_level = self.education_level
        self.parsed_location = self.location
        self.parsed_is_remote = self.is_remote
        self.parsed_description = self.description
        self.parsed_responsibilities = self.responsibilities
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} at {self.company}"
    
    class Meta:
        ordering = ['-created_at']


class JobApplication(models.Model):
    """Job application linking candidates to jobs."""
    
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('reviewing', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interviewed', 'Interviewed'),
        ('offered', 'Offered'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='applied')
    
    # AI Matching
    match_score = models.FloatField(blank=True, null=True, help_text="AI-calculated match score (0-100)")
    match_details = models.JSONField(blank=True, null=True, help_text="Detailed matching breakdown")
    
    # Cover letter / notes
    cover_letter = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-match_score', '-applied_at']
        unique_together = ['candidate', 'job']
    
    def __str__(self):
        return f"{self.candidate.name} -> {self.job.title}"