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
        'id',
        'title',
        'company',
        'status_badge',
        'job_type',
        'location',
        'applications_count',
        'created_at',
    ]
    
    list_filter = [
        'status',
        'job_type',
        'experience_level',
        'is_remote',
        'created_at',
    ]
    
    search_fields = [
        'title',
        'company',
        'description',
        'location',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'parsed_data_display',
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'title',
                'company',
                'location',
                'status',
            )
        }),
        ('Job Description', {
            'fields': (
                'description',
                'responsibilities',
                'requirements',
                'benefits',
            )
        }),
        ('Employment Details', {
            'fields': (
                'job_type',
                'experience_level',
                'min_experience',
                'max_experience',
                'education_level',
            )
        }),
        ('Skills', {
            'fields': (
                'skills_required',
                'skills_preferred',
            )
        }),
        ('Location & Remote', {
            'fields': (
                'is_remote',
            )
        }),
        ('Salary Information', {
            'fields': (
                'salary_min',
                'salary_max',
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
            ),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = [
        'activate_jobs',
        'close_jobs',
        'mark_as_draft',
    ]
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'draft': '#6c757d',
            'active': '#28a745',
            'closed': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display().upper()
        )
    status_badge.short_description = 'Status'
    
    def applications_count(self, obj):
        """Count of applications for this job"""
        count = obj.applications.count()
        return format_html('<strong>{}</strong>', count)
    applications_count.short_description = 'Applications'
    
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
        
        html += f'<strong>Experience Range:</strong> {obj.parsed_min_experience} - {obj.parsed_max_experience} years<br><br>'
        html += f'<strong>Education:</strong> {obj.parsed_education_level}<br><br>'
        html += f'<strong>Location:</strong> {obj.parsed_location}<br>'
        html += f'<strong>Remote:</strong> {"Yes" if obj.parsed_is_remote else "No"}<br>'
        
        html += '</div>'
        return format_html(html)
    parsed_data_display.short_description = 'AI-Parsed Data'
    
    def activate_jobs(self, request, queryset):
        """Bulk action to activate jobs"""
        count = queryset.update(status='active')
        self.message_user(request, f'{count} job(s) activated successfully.')
    activate_jobs.short_description = 'Activate selected jobs'
    
    def close_jobs(self, request, queryset):
        """Bulk action to close jobs"""
        count = queryset.update(status='closed')
        self.message_user(request, f'{count} job(s) closed successfully.')
    close_jobs.short_description = 'Close selected jobs'
    
    def mark_as_draft(self, request, queryset):
        """Bulk action to mark jobs as draft"""
        count = queryset.update(status='draft')
        self.message_user(request, f'{count} job(s) marked as draft.')
    mark_as_draft.short_description = 'Mark as draft'


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
    ]
    
    list_filter = [
        'status',
        'applied_at',
    ]
    
    search_fields = [
        'candidate__name',
        'candidate__email',
        'job__title',
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
                'notes',
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
        ('Metadata', {
            'fields': (
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = [
        'shortlist_applications',
        'reject_applications',
        'mark_as_reviewing',
    ]
    
    def candidate_name(self, obj):
        """Display candidate name with link"""
        url = reverse('admin:candidates_candidate_change', args=[obj.candidate.pk])
        return format_html('<a href="{}">{}</a>', url, obj.candidate.name)
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
            'reviewing': '#17a2b8',
            'shortlisted': '#28a745',
            'interviewed': '#6610f2',
            'offered': '#fd7e14',
            'hired': '#28a745',
            'rejected': '#dc3545',
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
        count = queryset.filter(status='applied').update(status='shortlisted')
        self.message_user(request, f'{count} application(s) shortlisted.')
    shortlist_applications.short_description = 'Shortlist selected applications'
    
    def reject_applications(self, request, queryset):
        """Bulk action to reject applications"""
        count = queryset.exclude(status__in=['hired', 'rejected']).update(status='rejected')
        self.message_user(request, f'{count} application(s) rejected.')
    reject_applications.short_description = 'Reject selected applications'
    
    def mark_as_reviewing(self, request, queryset):
        """Bulk action to mark applications as under review"""
        count = queryset.filter(status='applied').update(status='reviewing')
        self.message_user(request, f'{count} application(s) marked as reviewing.')
    mark_as_reviewing.short_description = 'Mark as reviewing'