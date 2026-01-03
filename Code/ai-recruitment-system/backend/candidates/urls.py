"""
URL routing for Candidates API endpoints.
"""
from django.urls import path
from .views import (
    CandidateApplicationView,
    CandidateListView,
    CandidateDetailView,
    CandidateUpdateView,
    CandidateDeleteView,
)

app_name = 'candidates'

urlpatterns = [
    # Public application endpoint
    path('apply/', CandidateApplicationView.as_view(), name='candidate-apply'),
    
    # Admin/Recruiter endpoints
    path('', CandidateListView.as_view(), name='candidate-list'),
    path('<int:id>/', CandidateDetailView.as_view(), name='candidate-detail'),
    path('<int:id>/update/', CandidateUpdateView.as_view(), name='candidate-update'),
    path('<int:id>/delete/', CandidateDeleteView.as_view(), name='candidate-delete'),
]