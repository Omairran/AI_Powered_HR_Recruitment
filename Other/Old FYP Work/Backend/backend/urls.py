"""
URL configuration for NLU project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


# ✅ Home / Health Check API
def home(request):
    return JsonResponse({
        "status": "OK",
        "message": "AI Powered HR Recruitment System Backend is running"
    })


urlpatterns = [
    # 🔹 Root URL
    path('', home, name='home'),

    # 🔹 Admin
    path('admin/', admin.site.urls),

    # 🔹 API Routes
    path('api/authentication/', include('authentication.urls')),
    path('api/job_posting/', include('job_posting.urls')),
    path('api/chat/', include('interview.urls')),
    path('api/confidence_prediction/', include('confidence_prediction.urls')),

    # 🔹 Social Auth (Google OAuth)
    path('auth/', include('social_django.urls', namespace='social')),
]

# 🔹 Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
