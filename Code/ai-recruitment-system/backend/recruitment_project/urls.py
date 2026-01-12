from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import api_root  # Add this import


urlpatterns = [
    path('', api_root, name='api-root'),  # Add this line
    path('admin/', admin.site.urls),
    path('api/candidates/', include('candidates.urls')),
    path('api/', include('jobs.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)