from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import json

class Job(models.Model):
    """
    Job posting model with AI-powered parsing capabilities
    """
    
    # Job Status Choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('on_hold', 'On Hold'),
    ]
    
    # Employment Type Choices
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('temporary', 'Temporary'),
    ]
    
    # Experience Level Choices
    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('lead', 'Lead/Principal'),
        ('executive', 'Executive'),
    ]
    
    # Basic Information
    job_id = models.CharField(max_length=50, unique=True, editable=False)
    title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, default='Your Company')
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Job Details
    description = models.TextField(help_text='Full job description')
    responsibilities = models.TextField(blank=True, help_text='Key responsibilities')
    requirements = models.TextField(blank=True, help_text='Required qualifications')
    nice_to_have = models.TextField(blank=True, help_text='Preferred qualifications')
    
    # Employment Details
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default='full_time'
    )
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVEL_CHOICES,
        default='mid'
    )
    min_experience_years = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )
    max_experience_years = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )
    
    # Location & Remote
    location = models.CharField(max_length=200)
    is_remote = models.BooleanField(default=False)
    remote_type = models.CharField(
        max_length=20,
        choices=[
            ('fully_remote', 'Fully Remote'),
            ('hybrid', 'Hybrid'),
            ('on_site', 'On-site'),
        ],
        default='on_site'
    )
    
    # Salary Information
    salary_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Minimum salary'
    )
    salary_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Maximum salary'
    )
    salary_currency = models.CharField(max_length=3, default='USD')
    salary_period = models.CharField(
        max_length=20,
        choices=[
            ('hourly', 'Hourly'),
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
        ],
        default='yearly'
    )
    
    # Parsed Data (AI-extracted from job description)
    parsed_required_skills = models.JSONField(
        default=list,
        blank=True,
        help_text='AI-extracted required skills'
    )
    parsed_preferred_skills = models.JSONField(
        default=list,
        blank=True,
        help_text='AI-extracted preferred skills'
    )
    parsed_qualifications = models.JSONField(
        default=list,
        blank=True,
        help_text='AI-extracted qualifications (degrees, certifications)'
    )
    parsed_responsibilities = models.JSONField(
        default=list,
        blank=True,
        help_text='AI-extracted key responsibilities'
    )
    parsed_benefits = models.JSONField(
        default=list,
        blank=True,
        help_text='AI-extracted benefits'
    )
    
    # Application Settings
    application_deadline = models.DateTimeField(blank=True, null=True)
    max_applications = models.IntegerField(
        blank=True,
        null=True,
        help_text='Maximum number of applications to accept'
    )
    
    # Status & Metadata
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_jobs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)
    
    # Analytics
    view_count = models.IntegerField(default=0)
    application_count = models.IntegerField(default=0)
    
    # Additional fields for matching
    keywords = models.JSONField(
        default=list,
        blank=True,
        help_text='Keywords for search and matching'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Job Posting'
        verbose_name_plural = 'Job Postings'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['job_id']),
        ]
    
    def __str__(self):
        return f"{self.job_id} - {self.title}"
    
    def save(self, *args, **kwargs):
        # Auto-generate job_id if not exists
        if not self.job_id:
            from django.utils import timezone
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.job_id = f"JOB-{timestamp}"
        
        # Set published_at when status changes to active
        if self.status == 'active' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        """Check if job is currently active and accepting applications"""
        if self.status != 'active':
            return False
        
        if self.application_deadline:
            from django.utils import timezone
            if timezone.now() > self.application_deadline:
                return False
        
        if self.max_applications and self.application_count >= self.max_applications:
            return False
        
        return True
    
    @property
    def salary_range_display(self):
        """Return formatted salary range"""
        if not self.salary_min and not self.salary_max:
            return "Not specified"
        
        currency_symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'PKR': 'Rs.',
        }
        symbol = currency_symbols.get(self.salary_currency, self.salary_currency)
        
        if self.salary_min and self.salary_max:
            return f"{symbol}{self.salary_min:,.0f} - {symbol}{self.salary_max:,.0f} {self.salary_period}"
        elif self.salary_min:
            return f"{symbol}{self.salary_min:,.0f}+ {self.salary_period}"
        else:
            return f"Up to {symbol}{self.salary_max:,.0f} {self.salary_period}"
    
    @property
    def experience_range_display(self):
        """Return formatted experience range"""
        if self.min_experience_years == 0 and self.max_experience_years == 0:
            return "No experience required"
        elif self.min_experience_years == self.max_experience_years:
            return f"{self.min_experience_years} years"
        else:
            return f"{self.min_experience_years}-{self.max_experience_years} years"
    
    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_application_count(self):
        """Increment application count"""
        self.application_count += 1
        self.save(update_fields=['application_count'])


class JobApplication(models.Model):
    """
    Link between Candidate and Job with application-specific data
    """
    
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('screening', 'Under Screening'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('offer_extended', 'Offer Extended'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    # Foreign Keys
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        'candidates.Candidate',
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    
    # Application Details
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='applied'
    )
    cover_letter = models.TextField(blank=True)
    
    # AI Matching Score (will be implemented in Module 3)
    match_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='AI-calculated match score (0-100)'
    )
    match_details = models.JSONField(
        default=dict,
        blank=True,
        help_text='Detailed matching breakdown'
    )
    
    # Screening
    screening_notes = models.TextField(blank=True)
    screening_score = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    
    # Interview
    interview_date = models.DateTimeField(blank=True, null=True)
    interview_notes = models.TextField(blank=True)
    interview_score = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    
    # HR Actions
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-applied_at']
        unique_together = ['job', 'candidate']
        verbose_name = 'Job Application'
        verbose_name_plural = 'Job Applications'
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['-match_score']),
        ]
    
    def __str__(self):
        return f"{self.candidate.full_name} -> {self.job.title}"
    
    def save(self, *args, **kwargs):
        # Set reviewed_at when status changes from 'applied'
        if self.pk:
            old_instance = JobApplication.objects.get(pk=self.pk)
            if old_instance.status == 'applied' and self.status != 'applied':
                if not self.reviewed_at:
                    from django.utils import timezone
                    self.reviewed_at = timezone.now()
        
        super().save(*args, **kwargs)