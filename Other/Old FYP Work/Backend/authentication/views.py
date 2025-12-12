from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

User = get_user_model()
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny

from .models import UserProfile
# views.py
# views.py
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from django.db import transaction
import random
import string
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def generate_random_password(self, length=12):
        characters = string.ascii_letters + string.digits + string.punctuation
        return ''.join(random.choice(characters) for _ in range(length))

    def post(self, request):
        try:
            token = request.data.get('token')
            if not token:
                return Response(
                    {'error': 'Token not provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the Google token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            email = idinfo['email']
            name = idinfo.get('name', '')

            # Check if the user exists
            user = User.objects.filter(email=email).first()

            if user:
                # Existing user: Log them in
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'username': user.username,
                    'is_recruiter': hasattr(user, 'userprofile') and user.userprofile.is_recruiter,
                }, status=status.HTTP_200_OK)
            else:
                # New user: Create an account
                with transaction.atomic():
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}_{counter}"
                        counter += 1

                    random_password = self.generate_random_password()
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=random_password
                    )

                    # Optional: Add user profile creation logic if needed
                    # UserProfile.objects.create(user=user, is_recruiter=False)

                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'username': user.username,
                        'is_recruiter': False,
                    }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            print("Token verification error:", str(e))
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print("Unexpected error:", str(e))
            return Response(
                {'error': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class JoinAsRecruiterView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get or create user profile
            user_profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # Check if user is already a recruiter
            if user_profile.is_recruiter:
                return Response({
                    "message": "You are already a recruiter",
                    "status": "success"
                })
            
            # Request status (pending admin approval)
            return Response({
                "message": "Recruiter access request submitted. Waiting for admin approval.",
                "status": "pending"
            })
        except Exception as e:
            return Response({
                "error": str(e),
                "status": "error"
            }, status=400)

class CheckRecruiterStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            return Response({
                "is_recruiter": user_profile.is_recruiter
            })
        except UserProfile.DoesNotExist:
            return Response({
                "is_recruiter": False
            })
class RegisterView(APIView):
    # Allow any user (including unauthenticated) to access this view
    permission_classes = [AllowAny]


    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        confirmPassword = request.data.get('confirmPassword')

        # Check if passwords match
        if password != confirmPassword:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the username already exists
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create a new user
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)


class CandidateLoginView(APIView):
    permission_classes = [AllowAny]
  # Allow unauthenticated access to login

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            profile = UserProfile.objects.get(user=user)
            # Check if user is a recruiter - if so, deny access
            if profile.is_recruiter:
                return Response({
                    'error': 'Please use the recruiter login page'
                }, status=status.HTTP_403_FORBIDDEN)
                
        except UserProfile.DoesNotExist:
            # If no profile exists, create one for candidate
            profile = UserProfile.objects.create(user=user, is_recruiter=False)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'is_recruiter': False
        })

class RecruiterLoginView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access to login

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            profile = UserProfile.objects.get(user=user)
            # Check if user is a recruiter - if not, deny access
            if not profile.is_recruiter:
                return Response({
                    'error': 'Please use the candidate login page'
                }, status=status.HTTP_403_FORBIDDEN)
                
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Please use the candidate login page'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'is_recruiter': True
        })

from rest_framework_simplejwt.exceptions import TokenError

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Logged out successfully"}, 
                status=status.HTTP_200_OK
            )
        except TokenError:
            # Token is already blacklisted or invalid
            return Response(
                {"message": "Logged out successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )




from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import json



# views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import CandidateTable

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_image(request):
    print("Logged-in user:", request.user)

    try:
        candidate = CandidateTable.objects.get(candidate=request.user)
        return Response({
            'profile_image': candidate.profile_image if candidate.profile_image else None,
            'candidate_name': candidate.candidate_name
        })
    except CandidateTable.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_image(request):
    try:
        candidate = CandidateTable.objects.get(candidate=request.user)
        
        if candidate.profile_image:
            return Response(
                {'error': 'Profile image already exists and cannot be modified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES.get('profile_image')
        if not image_file:
            return Response(
                {'error': 'Profile image is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would typically:
        # 1. Upload the file to your storage (e.g., S3, local storage)
        # 2. Get the URL of the uploaded file
        # For now, let's assume we're storing locally:
        
        from django.core.files.storage import default_storage
        from django.conf import settings
        import os
        
        # Create a unique filename
        filename = f'profile_images/{request.user.id}_{image_file.name}'
        
        # Save the file
        path = default_storage.save(filename, image_file)
        
        # Get the URL
        # file_url = os.path.join(settings.MEDIA_URL, path)
        file_url = request.build_absolute_uri(os.path.join(settings.MEDIA_URL, path))
        # Update candidate
        candidate.profile_image = file_url
        candidate.save()
        
        return Response({
            'message': 'Profile image uploaded successfully',
            'profile_image': candidate.profile_image
        })
    except CandidateTable.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    


from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])

def recruiter_registration_request(request):
    try:
        # Extract data from request
        data = request.data
        username = data.get('username')
        email = data.get('email')
        organization = data.get('organization')
        password = data.get('password')
        
        # Validate required fields
        if not all([username, email, organization, password]):
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Compose email content
        subject = f"New Recruiter Registration Request - {organization}"
        message = f"""
New Recruiter Registration Request

Details:
- Username: {username}
- Email: {email}
- Organization: {organization}

This recruiter has requested to join the AI-Powered Interviewing System.
Please review their application and create their account if approved.

Best regards,
AI Interviewing System
        """
        
        # Send email to all admin emails
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.ADMIN_EMAILS,  # Now using ADMIN_EMAILS list instead of single ADMIN_EMAIL
            fail_silently=False,
        )
        
        logger.info(f"Recruiter registration request received for {email}")
        
        return Response(
            {"message": "Registration request submitted successfully"},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Error processing recruiter registration: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )