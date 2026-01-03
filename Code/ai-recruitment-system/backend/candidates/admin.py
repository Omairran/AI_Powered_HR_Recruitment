"""
Django Admin configuration for Candidate model.
"""
from django.contrib import admin
from .models import Candidate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    """
    Admin interface for managing candidates.
    """
    list_display = [
        'full_name',
        'email',
        'phone',
        'application_status',
        'created_at',
        'has_parsed_data',
    ]
    list_filter = [
        'application_status',
        'created_at',
    ]
    search_fields = [
        'full_name',
        'email',
        'phone',
        'parsed_skills',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'parsed_text',
        'parsed_email',
        'parsed_phone',
        'parsed_skills',
    ]
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Resume', {
            'fields': ('resume',)
        }),
        ('Parsed Data', {
            'fields': (
                'parsed_text',
                'parsed_email',
                'parsed_phone',
                'parsed_skills',
            ),
            'classes': ('collapse',)
        }),
        ('Application Status', {
            'fields': ('application_status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_parsed_data(self, obj):
        """Display whether resume has been parsed."""
        return bool(obj.parsed_text)
    has_parsed_data.boolean = True
    has_parsed_data.short_description = 'Parsed'
    
    ordering = ['-created_at']