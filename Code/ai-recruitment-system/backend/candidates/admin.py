from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Candidate


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'first_name', 'last_name', 'is_staff']
    list_filter = ['user_type', 'is_staff', 'is_active']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone', 'company')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone', 'company')
        }),
    )


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'parsed_experience_years', 'created_at']
    search_fields = ['name', 'email']
    list_filter = ['parsed_education_level', 'created_at']
    readonly_fields = ['created_at', 'updated_at']