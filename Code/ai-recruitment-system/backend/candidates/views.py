"""
Enhanced API Views with improved resume parsing.
"""
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import Candidate
from .serializers import (
    CandidateSerializer,
    CandidateListSerializer,
    CandidateCreateSerializer
)
from .utils.resume_parser import EnhancedResumeParser


class CandidateApplicationView(generics.CreateAPIView):
    """
    POST /api/candidates/apply/
    Enhanced application endpoint with comprehensive resume parsing.
    Allows candidates to reapply/update by checking email first.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateCreateSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Handle candidate application with enhanced parsing.
        If email exists, update that record instead of creating new one.
        """
        email = request.data.get('email', '').lower()
        
        # Check if candidate already exists
        existing_candidate = None
        if email:
            try:
                existing_candidate = Candidate.objects.get(email=email)
                print(f"✓ Found existing candidate with email: {email}")
            except Candidate.DoesNotExist:
                print(f"→ New candidate with email: {email}")
        
        if existing_candidate:
            # Update existing candidate
            print(f"→ Updating existing candidate ID: {existing_candidate.id}")
            
            # Update basic fields
            existing_candidate.full_name = request.data.get('full_name', existing_candidate.full_name)
            if 'phone' in request.data:
                existing_candidate.phone = request.data.get('phone')
            
            # Update resume if new one uploaded
            if 'resume' in request.FILES:
                # Delete old resume
                if existing_candidate.resume:
                    existing_candidate.resume.delete(save=False)
                existing_candidate.resume = request.FILES['resume']
            
            existing_candidate.save()
            candidate = existing_candidate
            
        else:
            # Create new candidate
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            candidate = serializer.save()
        
        # Parse resume with enhanced parser
        try:
            parser = EnhancedResumeParser()
            resume_path = candidate.resume.path
            parsed_data = parser.parse(resume_path)
            
            # Update candidate with all parsed data
            candidate.parsed_text = parsed_data.get('text', '')
            candidate.parsed_name = parsed_data.get('name')
            candidate.parsed_email = parsed_data.get('email')
            candidate.parsed_phone = parsed_data.get('phone')
            
            # Links
            candidate.parsed_linkedin = parsed_data.get('linkedin')
            candidate.parsed_github = parsed_data.get('github')
            candidate.parsed_portfolio = parsed_data.get('portfolio')
            candidate.parsed_other_links = parsed_data.get('other_links', [])
            
            # Skills
            candidate.parsed_skills = parsed_data.get('skills', [])
            candidate.parsed_languages = parsed_data.get('languages', [])
            candidate.parsed_frameworks = parsed_data.get('frameworks', [])
            candidate.parsed_tools = parsed_data.get('tools', [])
            
            # Experience
            candidate.parsed_experience = parsed_data.get('experience', [])
            candidate.parsed_total_experience_years = parsed_data.get('total_experience_years')
            candidate.parsed_current_position = parsed_data.get('current_position')
            candidate.parsed_current_company = parsed_data.get('current_company')
            
            # Education
            candidate.parsed_education = parsed_data.get('education', [])
            candidate.parsed_highest_degree = parsed_data.get('highest_degree')
            candidate.parsed_university = parsed_data.get('university')
            
            # Additional
            candidate.parsed_certifications = parsed_data.get('certifications', [])
            candidate.parsed_projects = parsed_data.get('projects', [])
            candidate.parsed_summary = parsed_data.get('summary')
            candidate.parsed_location = parsed_data.get('location')
            
            # Set parsing status
            if any([
                candidate.parsed_email,
                candidate.parsed_skills,
                candidate.parsed_experience,
                candidate.parsed_education
            ]):
                candidate.parsing_status = 'success'
            else:
                candidate.parsing_status = 'partial'
            
            candidate.save()
            print(f"✓ Resume parsed and candidate updated successfully")
            
        except Exception as e:
            # Log error but don't fail the application
            error_message = str(e)
            print(f"✗ Resume parsing error for candidate {candidate.id}: {error_message}")
            candidate.parsing_status = 'failed'
            candidate.parsing_error = error_message
            candidate.save()
        
        # Return comprehensive response
        response_serializer = CandidateSerializer(
            candidate,
            context={'request': request}
        )
        
        return Response(
            {
                'message': 'Application submitted successfully!' if not existing_candidate else 'Application updated successfully!',
                'candidate': response_serializer.data,
                'is_update': bool(existing_candidate)
            },
            status=status.HTTP_201_CREATED
        )


class CandidateListView(generics.ListAPIView):
    """
    GET /api/candidates/
    List all candidates with key parsed information.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(application_status=status_filter)
        
        # Filter by parsing status
        parsing_status = self.request.query_params.get('parsing_status', None)
        if parsing_status:
            queryset = queryset.filter(parsing_status=parsing_status)
        
        return queryset


class CandidateDetailView(generics.RetrieveAPIView):
    """
    GET /api/candidates/<id>/
    Retrieve complete candidate information.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    lookup_field = 'id'


class CandidateUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/candidates/<id>/
    Update candidate information.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    lookup_field = 'id'
    
    def update(self, request, *args, **kwargs):
        """
        Handle candidate update - saves all manual edits.
        """
        partial = True
        instance = self.get_object()
        
        print(f"\n{'='*60}")
        print(f"UPDATING CANDIDATE ID: {instance.id}")
        print(f"{'='*60}")
        print(f"Request data received:")
        for key, value in request.data.items():
            print(f"  {key}: {value}")
        print(f"{'='*60}\n")
        
        # Get the serializer with data
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        
        # Validate
        try:
            serializer.is_valid(raise_exception=True)
            print("✓ Validation passed")
        except Exception as e:
            print(f"✗ Validation error: {str(e)}")
            print(f"✗ Errors: {serializer.errors}")
            raise
        
        # Save all the data
        print("\n→ Saving candidate data...")
        candidate = serializer.save()
        
        print(f"\n{'='*60}")
        print("DATA SAVED TO DATABASE:")
        print(f"{'='*60}")
        print(f"ID: {candidate.id}")
        print(f"Full Name: {candidate.full_name}")
        print(f"Email: {candidate.email}")
        print(f"Phone: {candidate.phone}")
        print(f"Location: {candidate.parsed_location}")
        print(f"LinkedIn: {candidate.parsed_linkedin}")
        print(f"GitHub: {candidate.parsed_github}")
        print(f"Portfolio: {candidate.parsed_portfolio}")
        print(f"Current Position: {candidate.parsed_current_position}")
        print(f"Current Company: {candidate.parsed_current_company}")
        print(f"Experience Years: {candidate.parsed_total_experience_years}")
        print(f"Highest Degree: {candidate.parsed_highest_degree}")
        print(f"University: {candidate.parsed_university}")
        print(f"Skills: {candidate.parsed_skills}")
        print(f"Summary: {candidate.parsed_summary[:100] if candidate.parsed_summary else None}...")
        print(f"{'='*60}\n")
        
        # Check if resume was updated
        resume_updated = 'resume' in request.FILES
        
        if resume_updated:
            print("→ NEW RESUME UPLOADED - Re-parsing...")
            try:
                parser = EnhancedResumeParser()
                resume_path = candidate.resume.path
                parsed_data = parser.parse(resume_path)
                
                # Update all parsed fields from new resume
                candidate.parsed_text = parsed_data.get('text', '')
                candidate.parsed_name = parsed_data.get('name')
                candidate.parsed_email = parsed_data.get('email')
                candidate.parsed_phone = parsed_data.get('phone')
                candidate.parsed_linkedin = parsed_data.get('linkedin')
                candidate.parsed_github = parsed_data.get('github')
                candidate.parsed_portfolio = parsed_data.get('portfolio')
                candidate.parsed_other_links = parsed_data.get('other_links', [])
                candidate.parsed_skills = parsed_data.get('skills', [])
                candidate.parsed_languages = parsed_data.get('languages', [])
                candidate.parsed_frameworks = parsed_data.get('frameworks', [])
                candidate.parsed_tools = parsed_data.get('tools', [])
                candidate.parsed_experience = parsed_data.get('experience', [])
                candidate.parsed_total_experience_years = parsed_data.get('total_experience_years')
                candidate.parsed_current_position = parsed_data.get('current_position')
                candidate.parsed_current_company = parsed_data.get('current_company')
                candidate.parsed_education = parsed_data.get('education', [])
                candidate.parsed_highest_degree = parsed_data.get('highest_degree')
                candidate.parsed_university = parsed_data.get('university')
                candidate.parsed_certifications = parsed_data.get('certifications', [])
                candidate.parsed_projects = parsed_data.get('projects', [])
                candidate.parsed_summary = parsed_data.get('summary')
                candidate.parsed_location = parsed_data.get('location')
                
                candidate.parsing_status = 'success'
                candidate.save()
                print("✓ Resume re-parsed and saved")
                
            except Exception as e:
                print(f"✗ Resume parsing error: {str(e)}")
                candidate.parsing_status = 'failed'
                candidate.parsing_error = str(e)
                candidate.save()
        else:
            print("✓ No new resume - manual edits saved")
        
        # Refresh from database to ensure we have the latest
        candidate.refresh_from_db()
        
        print(f"\n{'='*60}")
        print("FINAL DATA AFTER REFRESH:")
        print(f"{'='*60}")
        print(f"Full Name: {candidate.full_name}")
        print(f"Skills: {candidate.parsed_skills}")
        print(f"Location: {candidate.parsed_location}")
        print(f"{'='*60}\n")
        
        # Return the updated data
        response_serializer = self.get_serializer(candidate)
        return Response(response_serializer.data)


class CandidateDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/candidates/<id>/
    Delete a candidate record.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    lookup_field = 'id'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Delete resume file from storage
        if instance.resume:
            instance.resume.delete(save=False)
        
        self.perform_destroy(instance)
        
        return Response(
            {'message': 'Candidate deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )