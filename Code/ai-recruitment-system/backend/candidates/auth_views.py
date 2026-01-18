from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from .models import User, Candidate
from .serializers import UserSerializer, CandidateSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user (Candidate or HR)
    POST /api/auth/register/
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "secure_password",
        "user_type": "candidate",  // or "hr"
        "first_name": "John",
        "last_name": "Doe",
        "phone": "1234567890",
        "company": "Tech Corp"  // Only for HR
    }
    """
    try:
        # Extract data
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        user_type = request.data.get('user_type', 'candidate')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone', '')
        company = request.data.get('company', '')
        
        # Validate required fields
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            user_type=user_type,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            company=company if user_type == 'hr' else ''
        )
        
        # Create candidate profile if user is a candidate
        if user_type == 'candidate':
            Candidate.objects.create(
                user=user,
                name=f"{first_name} {last_name}".strip() or username,
                email=email,
                phone=phone
            )
        
        # Create authentication token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login user
    POST /api/auth/login/
    {
        "username": "john_doe",
        "password": "secure_password"
    }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get or create token
    token, created = Token.objects.get_or_create(user=user)
    
    # Get candidate profile if exists
    candidate_profile = None
    if user.user_type == 'candidate':
        try:
            candidate = Candidate.objects.get(user=user)
            candidate_profile = {
                'id': candidate.id,
                'name': candidate.name,
                'email': candidate.email,
                'phone': candidate.phone,
            }
        except Candidate.DoesNotExist:
            pass
    
    return Response({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'company': user.company,
        },
        'candidate_profile': candidate_profile,
        'token': token.key
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (delete token)
    POST /api/auth/logout/
    Headers: Authorization: Token <token>
    """
    try:
        # Delete the user's token
        request.user.auth_token.delete()
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user
    GET /api/auth/me/
    Headers: Authorization: Token <token>
    """
    user = request.user
    
    # Get candidate profile if exists
    candidate_profile = None
    if user.user_type == 'candidate':
        try:
            candidate = Candidate.objects.get(user=user)
            candidate_profile = CandidateSerializer(candidate).data
        except Candidate.DoesNotExist:
            pass
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'company': user.company,
        },
        'candidate_profile': candidate_profile
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile
    PUT /api/auth/profile/
    Headers: Authorization: Token <token>
    """
    user = request.user
    
    # Update user fields
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.phone = request.data.get('phone', user.phone)
    
    if user.user_type == 'hr':
        user.company = request.data.get('company', user.company)
    
    user.save()
    
    # Update candidate profile if exists
    if user.user_type == 'candidate':
        try:
            candidate = Candidate.objects.get(user=user)
            candidate.name = f"{user.first_name} {user.last_name}".strip()
            candidate.phone = user.phone
            candidate.save()
        except Candidate.DoesNotExist:
            pass
    
    return Response({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'company': user.company,
        }
    }, status=status.HTTP_200_OK)