# In urls.py for authentication app
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, 
    LogoutView, 
    JoinAsRecruiterView,
    CheckRecruiterStatusView,
    CandidateLoginView,
    RecruiterLoginView,
    GoogleAuthView,


)
from .views import get_profile_image, upload_profile_image,recruiter_registration_request

from django.urls import path
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

urlpatterns = [
    path('candidate/', CandidateLoginView.as_view(), name='token_obtain_pair'),
    path('recruiter/', RecruiterLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('join-as-recruiter/', JoinAsRecruiterView.as_view(), name='join_as_recruiter'),
    path('check-recruiter-status/', CheckRecruiterStatusView.as_view(), name='check_recruiter_status'),
    path('google/auth/', GoogleAuthView.as_view(), name='google_auth'),
    path('recruiter-request/', recruiter_registration_request, name='get-profile-image'),

    path('profile/image/', get_profile_image, name='get-profile-image'),
    path('profile/image/upload/', upload_profile_image, name='upload-profile-image'),


]