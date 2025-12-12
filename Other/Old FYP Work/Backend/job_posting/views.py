from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import JobPostingTable
from .serializers import JobPostingSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .models import ApplicationTable
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics,permissions
from .models import JobPostingTable
from .serializers import JobPostingSerializer,ApplicationSerializer,DetailedApplicationSerializer,SimplifiedApplicantSerializer
from authentication.models import RecruiterTable
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
import requests



#Linkedin Authorization And Job Posting on Linkedin
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import json
import urllib.parse
from base64 import b64encode

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import urllib.parse
import secrets
import json
import logging
# views.py
# views.py
logger = logging.getLogger(__name__)

# views.py
import logging
import secrets
import urllib.parse
import requests
import hashlib
import base64
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_code_verifier():
    code_verifier = secrets.token_urlsafe(64)
    return code_verifier

def generate_code_challenge(code_verifier):
    code_challenge = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge).decode('utf-8')
    code_challenge = code_challenge.replace('=', '')
    return code_challenge

class LinkedInAuthURLView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def get(self, request):
        try:
            # Generate PKCE values
            code_verifier = generate_code_verifier()
            code_challenge = generate_code_challenge(code_verifier)
            
            # Generate state
            state = secrets.token_urlsafe(32)
            
            # Store in session
            request.session['linkedin_code_verifier'] = code_verifier
            request.session['linkedin_state'] = state
            request.session.modified = True  # Force session save
            
            logger.info(f"Stored in session - verifier: {bool(code_verifier)}, state: {bool(state)}")
            
            scopes = [
                'openid',
                'profile',
                'email',
                'w_member_social'
            ]
            
            auth_params = {
                'response_type': 'code',
                'client_id': settings.LINKEDIN_CLIENT_ID,
                'redirect_uri': settings.LINKEDIN_REDIRECT_URI,
                'scope': ' '.join(scopes),
                'state': state,
                'code_challenge': code_challenge,
                'code_challenge_method': 'S256'
            }
            
            auth_url = 'https://www.linkedin.com/oauth/v2/authorization?' + \
                      urllib.parse.urlencode(auth_params)
            
            logger.info(f"Generated LinkedIn auth URL with params: {auth_params}")
            
            return Response({
                'auth_url': auth_url,
                'state': state,
                'code_verifier': code_verifier  # Send this back to frontend
            })
            
        except Exception as e:
            logger.error(f"Error in auth URL view: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LinkedInShareView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        try:
            code = request.data.get('code')
            job_data = request.data.get('jobData')
            code_verifier = request.data.get('code_verifier')
            
            logger.info("=== Starting LinkedIn Share Process ===")
            logger.info(f"Authorization code present: {bool(code)}")
            logger.info(f"Job data present: {bool(job_data)}")
            logger.info(f"Code verifier present: {bool(code_verifier)}")
            
            if not all([code, job_data, code_verifier]):
                missing = []
                if not code: missing.append('code')
                if not job_data: missing.append('job_data')
                if not code_verifier: missing.append('code_verifier')
                return Response(
                    {'error': f'Missing required data: {", ".join(missing)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Token exchange endpoint
            token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
            
            # Include all parameters in the request body
            token_params = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': settings.LINKEDIN_REDIRECT_URI,
                'client_id': settings.LINKEDIN_CLIENT_ID,
                'client_secret': settings.LINKEDIN_CLIENT_SECRET,
                'code_verifier': code_verifier
            }
            
            # Basic auth header (as backup)
            auth_str = f"{settings.LINKEDIN_CLIENT_ID}:{settings.LINKEDIN_CLIENT_SECRET}"
            auth_bytes = auth_str.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
            
            logger.info("=== Token Request Details ===")
            logger.info(f"Token URL: {token_url}")
            logger.info(f"Redirect URI: {settings.LINKEDIN_REDIRECT_URI}")
            logger.info(f"Client ID present in params: {bool(token_params.get('client_id'))}")
            logger.info(f"Auth header present: {bool(headers.get('Authorization'))}")
            
            # Log the exact parameters being sent (excluding sensitive data)
            safe_params = token_params.copy()
            safe_params['client_secret'] = '***'
            safe_params['code'] = '***'
            logger.info(f"Token parameters: {safe_params}")
            
            # Make token request
            logger.info("Making token request...")
            token_response = requests.post(
                token_url, 
                data=token_params,  # Send params as form data
                headers=headers,
                verify=True
            )
            
            logger.info(f"Token response status code: {token_response.status_code}")
            logger.info(f"Token response headers: {dict(token_response.headers)}")
            
            # Handle token response
            if token_response.status_code != 200:
                error_data = {}
                try:
                    error_data = token_response.json()
                except Exception as e:
                    logger.error(f"Failed to parse error response: {str(e)}")
                    error_data = {'text': token_response.text}
                
                logger.error(f"Token error response: {error_data}")
                
                # Enhanced error messages
                if error_data.get('error') == 'invalid_request':
                    details = error_data.get('error_description', 'Missing or invalid parameters')
                    logger.error(f"Invalid request error: {details}")
                    return Response({
                        'error': 'Invalid request parameters',
                        'details': details,
                        'sent_params': list(safe_params.keys())  # Log what params were sent
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif error_data.get('error') == 'invalid_client':
                    return Response({
                        'error': 'Invalid client credentials',
                        'details': 'Please verify your LinkedIn client ID and secret'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                return Response({
                    'error': 'Failed to obtain access token',
                    'details': error_data.get('error_description', 'Unknown error occurred')
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse successful response
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            if not access_token:
                logger.error("No access token in successful response")
                return Response({
                    'error': 'No access token received',
                    'details': token_data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info("Successfully obtained access token")
            
            # Return success response
            return Response({
                'status': 'Successfully authenticated',
                'token_type': token_data.get('token_type'),
                'expires_in': token_data.get('expires_in')
            })
            
        except Exception as e:
            logger.error(f"Unexpected error in share view: {str(e)}", exc_info=True)
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 
# My Application
class JobPostingView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = JobPostingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            job = serializer.save()
            
            # Add the job URL to the response
            response_data = serializer.data
            response_data['share_url'] = f"{settings.FRONTEND_URL}/jobs/{job.id}/apply"
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        posts = JobPostingTable.objects.all().order_by('-created_at')  # Add this method
        serializer = JobPostingSerializer(posts, many=True)
        return Response(serializer.data)
class JobPostListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = JobPostingSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # If user is a recruiter, show only their job posts
        if hasattr(user, 'recruiter_profile'):
            recruiter = user.recruiter_profile
            return JobPostingTable.objects.filter(recruiter=recruiter)
        
        # If user is a candidate, show all job posts
        return JobPostingTable.objects.all()

class JobPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = JobPostingTable.objects.all()
    serializer_class = JobPostingSerializer

    def perform_destroy(self, instance):
        # Ensure only the job's recruiter can delete
        user = self.request.user
        recruiter = RecruiterTable.objects.filter(recruiter_id=user).first()
        
        if instance.recruiter != recruiter:
            raise PermissionDenied("You are not authorized to delete this job posting.")
        
        instance.delete()


# Public posts and Job filtering + applying Search Functionality

class JobPostDetailPublic(generics.ListAPIView):
    
    # queryset = JobPostingTable.objects.filter(is_private=False)  # Filter to exclude private jobs
    serializer_class = JobPostingSerializer
    permission_classes = [AllowAny]  # This allows unauthenticated access
    def get_queryset(self):
        user = self.request.user
        print('user is ',user)
        queryset = JobPostingTable.objects.filter(is_private=False)  # Exclude private jobs

        if user.is_authenticated:
            # Get jobs the candidate has already applied for
            applied_jobs = ApplicationTable.objects.filter(candidate__candidate=user).values_list('job', flat=True)
            # Exclude those jobs from the queryset
            queryset = queryset.exclude(id__in=applied_jobs)
        print("queryset",queryset)
        return queryset
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Custom permissions can also be added

# job_posting/views.py
class JobPostingWithApplicantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            # Try to get or create recruiter profile
            recruiter, created = RecruiterTable.objects.get_or_create(
                recruiter=user,
                defaults={'recruiter_name': user.username}  # Adjust fields as needed
            )
            
            job_posts = JobPostingTable.objects.filter(recruiter=recruiter).order_by('-created_at')

            result = []
            for job in job_posts:
                applicants = ApplicationTable.objects.filter(job=job).order_by('-applied_at')[:2]
                result.append({
                    'id': job.id,
                    'job_title': job.title,
                    'skills': job.skills,
                    'posted_at': job.created_at,
                    'applicants': [
                        {
                            'candidate_name': app.candidate.candidate_name,
                            'interview_frames': app.interview_frames,
                            'confidence_score': app.confidence_score,
                            'face_verification_result': app.face_verification_result,
                            'flag_status': app.flag_status,
                            'interview_status': app.interview_status
                        } 
                        for app in applicants
                    ]
                })
            
            return Response(result)
        except Exception as e:
            print(f"Error in JobPostingWithApplicantsView: {str(e)}")
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
from django.views.generic.list import ListView
from django.http import JsonResponse
from .models import ApplicationTable, JobPostingTable
from django.contrib.auth.mixins import LoginRequiredMixin

class ApplicantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = JobPostingTable.objects.get(id=job_id, recruiter=request.user.recruiter_profile)
            applicants = ApplicationTable.objects.filter(job=job)
            serializer = ApplicationSerializer(applicants, many=True)
            return Response(serializer.data)
        except JobPostingTable.DoesNotExist:
            return Response({"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
class SortedApplicantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            # Get query parameters
            limit = request.query_params.get('limit', '15')
            sort_order = request.query_params.get('sort_order', 'desc')

            # Verify job access
            job = JobPostingTable.objects.get(
                id=job_id, 
                recruiter=request.user.recruiter_profile
            )

            # Get applicants with marks
            applicants = ApplicationTable.objects.filter(job=job).exclude(marks__isnull=True)

            # Convert to list for custom sorting
            applicants_list = list(applicants)

            # Sort based on marks percentage
            def get_percentage(marks_str):
                try:
                    if marks_str and '/' in marks_str:
                        num, den = map(float, marks_str.split('/'))
                        print('num',num)
                        print('den',den)
                        print("Percentages is",(num / den) * 100)
                        return (num / den) * 100
                    return 0
                except:
                    return 0

            applicants_list.sort(
                key=lambda x: get_percentage(x.marks),
                reverse=(sort_order.lower() == 'desc')
            )

            # Apply limit
            if limit.isdigit():
                applicants_list = applicants_list[:int(limit)]

            # Use a simplified serializer for the sorted list
            serializer = SimplifiedApplicantSerializer(applicants_list, many=True)
            return Response(serializer.data)

        except JobPostingTable.DoesNotExist:
            return Response(
                {"detail": "Job not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


from django.conf import settings
import logging
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.http import FileResponse  # Add this import

logger = logging.getLogger(__name__)

class ApplicantDetailView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch']

    def send_status_email(self, applicant, status):
        try:
            subject = "Update on Your Job Application"
            template_name = (
                "emails/selection_email.html" if status == "Selected" 
                else "emails/rejection_email.html"
            )
            
            # Render HTML email template
            html_message = render_to_string(
                template_name,
                {'applicant': applicant}
            )
            
            # Create plain text version of the email
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,  # Plain text version
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[applicant.email],
                html_message=html_message,  # HTML version
                fail_silently=False,
            )
            
            logger.info(f"Email sent successfully to {applicant.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def patch(self, request, applicant_id):
        try:
            applicant = ApplicationTable.objects.get(
                id=applicant_id,
                job__recruiter=request.user.recruiter_profile
            )
            new_status = request.data.get('application_status')
            
            # Save the status first
            applicant.application_status = new_status
            applicant.save()

            # Then attempt to send email
            if new_status in ["Selected", "Rejected"]:
                email_sent = self.send_status_email(applicant, new_status)
                if not email_sent:
                    # Even if email fails, we still return 200 since status was updated
                    return Response({
                        "detail": "Status updated but email notification failed",
                        "data": DetailedApplicationSerializer(applicant).data
                    }, status=200)

            return Response(DetailedApplicationSerializer(applicant).data)
            
        except ApplicationTable.DoesNotExist:
            return Response({"detail": "Applicant not found"}, status=404)
        except Exception as e:
            logger.error(f"Error in patch: {str(e)}")
            return Response({
                "detail": f"An error occurred: {str(e)}"
            }, status=500)
        
    def get(self, request, applicant_id):
        try:
            applicant = ApplicationTable.objects.get(
                id=applicant_id, 
                job__recruiter=request.user.recruiter_profile
            )
            
            if 'download' in request.query_params:
                return FileResponse(applicant.resume.open(), content_type='application/pdf')
                
            serializer = DetailedApplicationSerializer(applicant)
            return Response(serializer.data)
        except ApplicationTable.DoesNotExist:
            return Response({"detail": "Applicant not found"}, status=status.HTTP_404_NOT_FOUND)
        
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ApplicationTable, JobPostingTable, CandidateTable
from .serializers import ApplicationTableSerializer

class JobApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            job_id = request.data.get("job_id")
            job = JobPostingTable.objects.get(id=job_id)
            candidate = CandidateTable.objects.get(candidate=request.user)
            
            application = ApplicationTable.objects.create(
                candidate=candidate,
                job=job,
                full_name=request.data.get("full_name"),
                email=request.data.get("email"),
                marks=request.data.get("marks", 0),
                qualification=request.data.get("qualification"),
                resume=request.FILES.get("resume"),
                # interview_status=request.get("interview_status")

            )
            application.save()

            return Response({"message": "Application submitted successfully."}, status=status.HTTP_201_CREATED)

        except JobPostingTable.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
        except CandidateTable.DoesNotExist:
            return Response({"error": "Candidate not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

    


# views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ApplicationTable, JobPostingTable
from rest_framework.response import Response

class CandidateAppliedJobsView(generics.ListAPIView):
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        try:
            candidate = CandidateTable.objects.get(candidate=user)
            # Get all jobs where the candidate has applications
            applied_jobs = JobPostingTable.objects.filter(
                applicationtable__candidate=candidate
            ).distinct()
            return applied_jobs
        except CandidateTable.DoesNotExist:
            return JobPostingTable.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for job in queryset:
            application = ApplicationTable.objects.filter(
                candidate__candidate=request.user,
                job=job,
                interview_status=False  # Only include applications where interview_status=False

            ).first()
            # If there is no valid application, skip this job
            if not application:
                continue
            
            job_data = {
                'id': job.id,
                'title': job.title,
                'description': job.description,
                'skills': job.skills,
                'experience_level': job.experience_level,
                'location': job.location,
                'status': job.status,
                'created_at': job.created_at,
                'application_date': application.applied_at if application else None,
                'marks': application.marks if application else None,
                'interview_status':application.interview_status,
                'application_status':application.application_status
            }
            data.append(job_data)
            
        return Response(data)


from rest_framework.exceptions import NotFound

class CurrentCandidateProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            candidate = CandidateTable.objects.get(candidate=request.user)
            candidate_data = {
                'id': candidate.id,
                'name': candidate.candidate_name,
                'email': candidate.candidate_email,
                'profile_image': candidate.profile_image,  # This will be the URL
            }
            return Response(candidate_data)
        except CandidateTable.DoesNotExist:
            raise NotFound("Candidate profile not found.")



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application_status(request, job_id):
    try:
        application = ApplicationTable.objects.get(
            candidate_id=request.user.candidatetable.id,
            job_id=job_id,
            
        )
        return Response({'status': application.status})
    except ApplicationTable.DoesNotExist:
        return Response({'status': 'Not Applied'}, status=404)
    





# views.py
from django.http import HttpResponse
import zipfile
import os
from io import BytesIO
import json
from django.conf import settings
from .models import ApplicationTable

def download_frames_as_zip(request, application_id):
    try:
        application = ApplicationTable.objects.get(id=application_id)
        
        # Create a BytesIO buffer for the zip file
        zip_buffer = BytesIO()
        
        # Create a zip file
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            # Get the frames from the JSON field
            frames = application.interview_frames
            
            if not frames:
                return HttpResponse("No frames available for this application", status=404)
            
            # Add each image to the zip file
            for frame in frames:
                # Get the file path relative to MEDIA_ROOT
                file_path = frame['url'].lstrip('/')
                absolute_path = os.path.join(settings.MEDIA_ROOT, file_path.replace('media/', '', 1))
                
                if os.path.exists(absolute_path):
                    # Add file to zip with just the filename as the archive name
                    zip_file.write(absolute_path, frame['filename'])
                    
        # Reset buffer position
        zip_buffer.seek(0)
        
        # Create response with zip file
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename=interview_frames_{application_id}.zip'
        
        return response
    
    except ApplicationTable.DoesNotExist:
        return HttpResponse("Application not found", status=404)
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)