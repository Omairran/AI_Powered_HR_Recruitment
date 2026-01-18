from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from candidates import auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/register/', auth_views.register, name='register'),
    path('api/auth/login/', auth_views.login, name='login'),
    path('api/auth/logout/', auth_views.logout, name='logout'),
    path('api/auth/me/', auth_views.get_current_user, name='current-user'),
    path('api/auth/profile/', auth_views.update_profile, name='update-profile'),
    
    # App URLs
    path('api/', include('candidates.urls')),
    path('api/', include('jobs.urls')),
    
    # Root URL
    path('', lambda request: JsonResponse({'message': 'Welcome to AI Recruitment System API', 'status': 'running'})),
]

# Media files (for uploaded resumes)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)