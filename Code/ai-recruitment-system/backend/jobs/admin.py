from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Job, JobApplication

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """
    Admin interface for Job model with enhanced features
    """
    
    list_display = [
        'job_id_display',
        'title',
        'company_name',
        'status_badge',
        'employment_type',
        'location',
        'application_count',
        'view_count',
        'created_at',
        'is_active_badge',
    ]
    
    list_filter = [
        'status',
        'employment_type',
        'experience_level',
        'is_remote',
        'remote_type',
        'created_at',
    ]
    
    search_fields = [
        'job_id',
        'title',
        'company_name',
        'description',
        'location',
    ]
    
    readonly_fields = [
        'job_id',
        'created_at',
        'updated_at',
        'published_at',
        'view_count',
        'application_count',
        'parsed_data_display',
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'job_id',
                'title',
                'company_name',
                'department',
                'status',
            )
        }),
        ('Job Description', {
            'fields': (
                'description',
                'responsibilities',
                'requirements',
                'nice_to_have',
            )
        }),
        ('Employment Details', {
            'fields': (
                'employment_type',
                'experience_level',
                'min_experience_years',
                'max_experience_years',
            )
        }),
        ('Location & Remote', {
            'fields': (
                'location',
                'is_remote',
                'remote_type',
            )
        }),
        ('Salary Information', {
            'fields': (
                'salary_min',
                'salary_max',
                'salary_currency',
                'salary_period',
            ),
            'classes': ('collapse',),
        }),
        ('AI-Parsed Data', {
            'fields': (
                'parsed_data_display',
            ),
            'classes': ('collapse',),
        }),
        ('Application Settings', {
            'fields': (
                'application_deadline',
                'max_applications',
            ),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
                'published_at',
                'view_count',
                'application_count',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = [
        'publish_jobs',
        'close_jobs',
        'mark_as_on_hold',
    ]
    
    def job_id_display(self, obj):
        """Display job ID with link"""
        url = reverse('admin:jobs_job_change', args=[obj.pk])
        return format_html('<a href="{}">{}</a>', url, obj.job_id)
    job_id_display.short_description = 'Job ID'
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'draft': '#6c757d',
            'active': '#28a745',
            'closed': '#dc3545',
            'on_hold': '#ffc107',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display().upper()
        )
    status_badge.short_description = 'Status'
    
    def is_active_badge(self, obj):
        """Display active status badge"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Active</span>'
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">✗ Inactive</span>'
        )
    is_active_badge.short_description = 'Accepting Applications'
    
    def parsed_data_display(self, obj):
        """Display parsed data in a readable format"""
        html = '<div style="font-family: monospace; font-size: 12px;">'
        
        if obj.parsed_required_skills:
            html += '<strong>Required Skills:</strong><br>'
            html += ', '.join(obj.parsed_required_skills[:10])
            if len(obj.parsed_required_skills) > 10:
                html += f' ... and {len(obj.parsed_required_skills) - 10} more'
            html += '<br><br>'
        
        if obj.parsed_preferred_skills:
            html += '<strong>Preferred Skills:</strong><br>'
            html += ', '.join(obj.parsed_preferred_skills[:10])
            html += '<br><br>'
        
        if obj.parsed_qualifications:
            html += '<strong>Qualifications:</strong><br>'
            for qual in obj.parsed_qualifications[:5]:
                html += f'• {qual}<br>'
            html += '<br>'
        
        if obj.parsed_responsibilities:
            html += '<strong>Responsibilities:</strong><br>'
            for resp in obj.parsed_responsibilities[:5]:
                html += f'• {resp[:100]}...<br>'
            html += '<br>'
        
        if obj.parsed_benefits:
            html += '<strong>Benefits:</strong><br>'
            html += ', '.join(obj.parsed_benefits)
        
        html += '</div>'
        return format_html(html)
    parsed_data_display.short_description = 'AI-Parsed Data'
    
    def publish_jobs(self, request, queryset):
        """Bulk action to publish draft jobs"""
        draft_jobs = queryset.filter(status='draft')
        count = draft_jobs.update(status='active', published_at=timezone.now())
        self.message_user(request, f'{count} job(s) published successfully.')
    publish_jobs.short_description = 'Publish selected jobs'
    
    def close_jobs(self, request, queryset):
        """Bulk action to close jobs"""
        count = queryset.filter(status__in=['active', 'on_hold']).update(status='closed')
        self.message_user(request, f'{count} job(s) closed successfully.')
    close_jobs.short_description = 'Close selected jobs'
    
    def mark_as_on_hold(self, request, queryset):
        """Bulk action to mark jobs as on hold"""
        count = queryset.filter(status='active').update(status='on_hold')
        self.message_user(request, f'{count} job(s) marked as on hold.')
    mark_as_on_hold.short_description = 'Mark as on hold'


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    """
    Admin interface for JobApplication model
    """
    
    list_display = [
        'id',
        'candidate_name',
        'job_title',
        'status_badge',
        'match_score_display',
        'applied_at',
        'reviewed_status',
    ]
    
    list_filter = [
        'status',
        'applied_at',
        'reviewed_at',
    ]
    
    search_fields = [
        'candidate__full_name',
        'candidate__email',
        'job__title',
        'job__job_id',
    ]
    
    readonly_fields = [
        'applied_at',
        'updated_at',
        'match_score',
        'match_details_display',
    ]
    
    fieldsets = (
        ('Application Info', {
            'fields': (
                'job',
                'candidate',
                'status',
                'cover_letter',
                'applied_at',
            )
        }),
        ('AI Matching', {
            'fields': (
                'match_score',
                'match_details_display',
            ),
            'classes': ('collapse',),
        }),
        ('Screening', {
            'fields': (
                'screening_notes',
                'screening_score',
            ),
            'classes': ('collapse',),
        }),
        ('Interview', {
            'fields': (
                'interview_date',
                'interview_notes',
                'interview_score',
            ),
            'classes': ('collapse',),
        }),
        ('Review Info', {
            'fields': (
                'reviewed_by',
                'reviewed_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = [
        'shortlist_applications',
        'reject_applications',
        'schedule_interviews',
    ]
    
    def candidate_name(self, obj):
        """Display candidate name with link"""
        url = reverse('admin:candidates_candidate_change', args=[obj.candidate.pk])
        return format_html('<a href="{}">{}</a>', url, obj.candidate.full_name)
    candidate_name.short_description = 'Candidate'
    
    def job_title(self, obj):
        """Display job title with link"""
        url = reverse('admin:jobs_job_change', args=[obj.job.pk])
        return format_html('<a href="{}">{}</a>', url, obj.job.title)
    job_title.short_description = 'Job'
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'applied': '#6c757d',
            'screening': '#17a2b8',
            'shortlisted': '#28a745',
            'interview_scheduled': '#007bff',
            'interviewed': '#6610f2',
            'offer_extended': '#fd7e14',
            'hired': '#28a745',
            'rejected': '#dc3545',
            'withdrawn': '#6c757d',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 10px;">{}</span>',
            color,
            obj.get_status_display().upper()
        )
    status_badge.short_description = 'Status'
    
    def match_score_display(self, obj):
        """Display match score with color coding"""
        if obj.match_score is None:
            return format_html('<span style="color: #999;">Not calculated</span>')
        
        score = float(obj.match_score)
        if score >= 80:
            color = '#28a745'
        elif score >= 60:
            color = '#ffc107'
        else:
            color = '#dc3545'
        
        return format_html(
            '<strong style="color: {};">{:.1f}%</strong>',
            color,
            score
        )
    match_score_display.short_description = 'Match Score'
    
    def reviewed_status(self, obj):
        """Display review status"""
        if obj.reviewed_at:
            return format_html(
                '<span style="color: green;">✓ Reviewed</span><br>'
                '<small>{}</small>',
                obj.reviewed_at.strftime('%Y-%m-%d %H:%M')
            )
        return format_html('<span style="color: #999;">Not reviewed</span>')
    reviewed_status.short_description = 'Review Status'
    
    def match_details_display(self, obj):
        """Display match details in readable format"""
        if not obj.match_details:
            return 'No match details available'
        
        html = '<div style="font-family: monospace; font-size: 12px;">'
        for key, value in obj.match_details.items():
            html += f'<strong>{key}:</strong> {value}<br>'
        html += '</div>'
        return format_html(html)
    match_details_display.short_description = 'Match Details'
    
    def shortlist_applications(self, request, queryset):
        """Bulk action to shortlist applications"""
        count = queryset.filter(status='applied').update(
            status='shortlisted',
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{count} application(s) shortlisted.')
    shortlist_applications.short_description = 'Shortlist selected applications'
    
    def reject_applications(self, request, queryset):
        """Bulk action to reject applications"""
        count = queryset.exclude(status__in=['hired', 'rejected']).update(
            status='rejected',
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{count} application(s) rejected.')
    reject_applications.short_description = 'Reject selected applications'
    
    def schedule_interviews(self, request, queryset):
        """Bulk action to mark applications for interview"""
        count = queryset.filter(status='shortlisted').update(
            status='interview_scheduled',
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{count} application(s) marked for interview.')
    schedule_interviews.short_description = 'Schedule interviews'