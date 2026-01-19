from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Candidate
from .serializers import CandidateSerializer
import PyPDF2
import docx
import io
import re


class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for now
    
    def extract_text_from_pdf(self, file):
        """Extract text from PDF file using pdfminer for better accuracy."""
        try:
            from pdfminer.high_level import extract_text
            # Create a temporary file because pdfminer expects a path or file-like object
            # For InMemoryUploadedFile, we might need to write it to disk or use BytesIO
            import tempfile
            import os
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
                for chunk in file.chunks():
                    temp.write(chunk)
                temp_path = temp.name
            
            text = extract_text(temp_path)
            
            # Cleanup
            os.unlink(temp_path)
            return text
        except Exception as e:
            print(f"Error extracting PDF with pdfminer: {e}")
            # Fallback to PyPDF2
            try:
                file.seek(0)
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except Exception as e2:
                print(f"Error extracting PDF with PyPDF2: {e2}")
                return ""

    def extract_text_from_docx(self, file):
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            return ""
    
    def extract_text_from_txt(self, file):
        """Extract text from TXT file."""
        try:
            return file.read().decode('utf-8')
        except Exception as e:
            print(f"Error extracting TXT: {e}")
            return ""
    
    def parse_resume(self, file):
        """Parse resume and extract information."""
        file_extension = file.name.split('.')[-1].lower()
        
        # Extract text based on file type
        if file_extension == 'pdf':
            text = self.extract_text_from_pdf(file)
        elif file_extension in ['docx', 'doc']:
            text = self.extract_text_from_docx(file)
        elif file_extension == 'txt':
            text = self.extract_text_from_txt(file)
        else:
            return {
                'parsed_text': '',
                'parsed_skills': [],
                'parsed_experience_years': 0,
                'parsed_education_level': '',
                'parsed_location': '',
                'parsed_summary': '',
                'parsed_linkedin': '',
                'parsed_github': '',
                'parsed_portfolio': '',
                'parsing_status': 'failed',
                'parsing_error': f'Unsupported file type: {file_extension}'
            }
        
        # Enhanced Parsing Logic
        parsed_data = {
            'parsed_text': text,
            'parsed_name': self.extract_name(text),
            'parsed_email': self.extract_email(text),
            'parsed_phone': self.extract_phone(text),
            'parsed_skills': self.extract_skills(text),
            'parsed_experience_years': self.extract_experience(text),
            'parsed_education_level': self.extract_education(text),
            'parsed_location': self.extract_location(text),
            'parsed_summary': text[:500] if text else '',
            'parsing_status': 'success' if text else 'failed',
            'parsing_error': None if text else 'No text extracted from file'
        }
        
        # Extract Links
        links = self.extract_links(text)
        parsed_data.update(links)
        
        return parsed_data
    
    def extract_links(self, text):
        """Extract social links from text."""
        links = {
            'parsed_linkedin': '',
            'parsed_github': '',
            'parsed_portfolio': ''
        }
        
        # LinkedIn
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9\-\_]+)/?'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_match:
            links['parsed_linkedin'] = f"https://www.linkedin.com/in/{linkedin_match.group(1)}"
            
        # GitHub
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9\-\_]+)/?'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        if github_match:
            links['parsed_github'] = f"https://github.com/{github_match.group(1)}"
            
        # Portfolio / Website (Generic URL)
        # Exclude common non-portfolio domains
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
        urls = re.findall(url_pattern, text)
        excluded_domains = ['linkedin.com', 'github.com', 'google.com', 'facebook.com', 'twitter.com', 'instagram.com']
        
        for url in urls:
            is_excluded = any(domain in url for domain in excluded_domains)
            if not is_excluded:
                links['parsed_portfolio'] = url if url.startswith('http') else 'https://' + url
                break
                
        return links

    def extract_skills(self, text):
        """Extract skills from resume text."""
        # Expanded skill list
        common_skills = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue',
            'node', 'django', 'flask', 'spring', 'sql', 'mysql', 'postgresql',
            'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
            'git', 'agile', 'scrum', 'rest', 'api', 'html', 'css', 'typescript',
            'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin', 'machine learning',
            'deep learning', 'ai', 'data science', 'tensorflow', 'pytorch',
            'pandas', 'numpy', 'scikit-learn', 'jenkins', 'ci/cd', 'linux',
            'figma', 'jira', 'confluence'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in common_skills:
            # Word boundary check to avoid partial matches (e.g., "go" in "good")
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found_skills.append(skill.title())
        
        return list(set(found_skills))

    def extract_experience(self, text):
        """Extract years of experience from text."""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of)?\s*experience',
            r'experience[:\s]+(\d+)\+?\s*years?',
            r'(\d+)\s*years?', # Broad fallback
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                try:
                    val = int(match.group(1))
                    if 0 < val < 40: # Sanity check
                        return val
                except:
                    pass
        return 0
    
    def extract_education(self, text):
        """Extract education level from text."""
        text_lower = text.lower()
        
        if 'phd' in text_lower or 'doctorate' in text_lower:
            return 'PhD'
        elif 'master' in text_lower or 'msc' in text_lower or 'mba' in text_lower:
            return 'Master'
        elif 'bachelor' in text_lower or 'bsc' in text_lower or 'bs' in text_lower:
            return 'Bachelor'
        elif 'associate' in text_lower:
            return 'Associate'
        elif 'diploma' in text_lower:
            return 'Diploma'
        
        return ''

    def extract_location(self, text):
        """Extract location from text."""
        cities = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'new york', 'london', 'remote']
        text_lower = text.lower()
        
        for city in cities:
            if re.search(r'\b' + re.escape(city) + r'\b', text_lower):
                return city.title()
        
        return ''

    def extract_name(self, text):
        """Extract name (basic fallback)"""
        # In a real scenario, use spaCy or the parser utility
        # For now, we'll try to guess based on first lines
        lines = text.split('\n')
        for line in lines[:5]:
            if len(line.strip()) > 3 and len(line.split()) < 4:
                return line.strip()
        return ''

    def extract_email(self, text):
        """Extract email"""
        match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        return match.group(0) if match else ''

    def extract_phone(self, text):
        """Extract phone"""
        match = re.search(r'(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', text)
        return match.group(0) if match else ''
    
    @action(detail=False, methods=['post'])
    def parse_resume_only(self, request):
        """
        Parse resume and return data without saving.
        Used for the "Review" step in the frontend.
        """
        try:
            resume = request.FILES.get('resume')
            if not resume:
                return Response(
                    {'error': 'No resume file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parsed_data = self.parse_resume(resume)
            return Response(parsed_data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def apply(self, request):
        """Handle candidate application with resume upload."""
        try:
            # Get data
            name = request.data.get('name')
            email = request.data.get('email')
            phone = request.data.get('phone', '')
            resume = request.FILES.get('resume')
            job_id = request.data.get('job_id')
            
            # Validate required fields
            if not name or not email:
                return Response(
                    {'error': 'Name and email are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if candidate already exists
            candidate = None
            created = False
            
            # 1. Try to find by authenticated user first
            if request.user.is_authenticated:
                try:
                    candidate = request.user.candidate_profile
                except Candidate.DoesNotExist:
                    pass
            
            # 2. If not found, try to find by email
            if not candidate:
                candidate = Candidate.objects.filter(email=email).first()
                if candidate:
                    # If found by email but user is authenticated and this candidate has no user, link them
                    if request.user.is_authenticated and not candidate.user:
                        candidate.user = request.user
                        candidate.save()
                    elif request.user.is_authenticated and candidate.user != request.user:
                        # Email belongs to another user?!
                        return Response(
                            {'error': 'This email is already associated with another account.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

            # 3. Create if still not found
            if not candidate:
                candidate = Candidate.objects.create(
                    email=email,
                    name=name,
                    phone=phone,
                    user=request.user if request.user.is_authenticated else None
                )
                created = True
            
            # Update existing candidate basic info
            if not created:
                candidate.name = name
                candidate.phone = phone
                if request.user.is_authenticated and not candidate.user:
                     candidate.user = request.user
                candidate.save()
            
            # 1. Handle Resume & Parsing
            parsed_data = {}
            
            # If resume file is provided, we might parse it OR rely on user-reviewed data
            if resume:
                candidate.resume = resume
                # We do a fresh parse just to have the "raw" data or file processing
                # But we will PREFER the data sent in the request (user reviewed data)
                raw_parsed_data = self.parse_resume(resume)
                parsed_data.update(raw_parsed_data)
            
            # 2. Override with User-Reviewed Data (from request.data)
            # This allows the user to correct the AI's mistakes
            reviewed_skills = request.data.get('parsed_skills')
            reviewed_experience = request.data.get('parsed_experience_years')
            reviewed_education = request.data.get('parsed_education_level')
            reviewed_location = request.data.get('parsed_location')
            reviewed_summary = request.data.get('parsed_summary')

            # Handle comma-separated skills string if that's what's sent
            if reviewed_skills is not None:
                if isinstance(reviewed_skills, str):
                    # If sent as string "Python, Django"
                    parsed_data['parsed_skills'] = [s.strip() for s in reviewed_skills.split(',') if s.strip()]
                else:
                    # If sent as list (when using JSON content type, though this is FormData)
                    parsed_data['parsed_skills'] = reviewed_skills

            if reviewed_experience is not None:
                try:
                    if str(reviewed_experience).strip():
                        parsed_data['parsed_experience_years'] = float(reviewed_experience)
                    else:
                        parsed_data['parsed_experience_years'] = 0.0
                except (ValueError, TypeError):
                    parsed_data['parsed_experience_years'] = 0.0

            if reviewed_education is not None:
                parsed_data['parsed_education_level'] = reviewed_education
            
            if reviewed_location is not None:
                parsed_data['parsed_location'] = reviewed_location
                
            if reviewed_summary is not None:
                parsed_data['parsed_summary'] = reviewed_summary

            # Basic Info override if provided in review
            reviewed_name = request.data.get('parsed_name')
            reviewed_email = request.data.get('parsed_email')
            reviewed_phone = request.data.get('parsed_phone')
            
            if reviewed_name:
                candidate.name = reviewed_name
                candidate.parsed_name = reviewed_name
            if reviewed_email:
                candidate.email = reviewed_email # Be careful updating primary email, but user requested
                candidate.parsed_email = reviewed_email
            if reviewed_phone:
                candidate.phone = reviewed_phone
                candidate.parsed_phone = reviewed_phone
                
            # Links
            reviewed_linkedin = request.data.get('parsed_linkedin')
            if reviewed_linkedin:
                parsed_data['parsed_linkedin'] = reviewed_linkedin
                
            reviewed_github = request.data.get('parsed_github')
            if reviewed_github:
                parsed_data['parsed_github'] = reviewed_github
                
            reviewed_portfolio = request.data.get('parsed_portfolio')
            if reviewed_portfolio:
                parsed_data['parsed_portfolio'] = reviewed_portfolio

            # Save parsed/reviewed data to candidate
            for key, value in parsed_data.items():
                if hasattr(candidate, key):
                    setattr(candidate, key, value)
            
            candidate.save()
            
            # Create job application if job_id provided
            if job_id:
                from jobs.models import Job, JobApplication
                from jobs.utils.matching_engine import CandidateJobMatcher
                
                try:
                    job = Job.objects.get(id=job_id)
                    
                    # Check if application already exists
                    application, app_created = JobApplication.objects.get_or_create(
                        candidate=candidate,
                        job=job,
                        defaults={'status': 'applied'}
                    )
                    
                    if not app_created:
                        return Response(
                            {'error': 'You have already applied to this job'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Calculate match score
                    try:
                        matcher = CandidateJobMatcher()
                        
                        # Use the CANDIDATE object's data which we just updated
                        candidate_data = {
                            'parsed_skills': candidate.parsed_skills or [],
                            'parsed_experience_years': candidate.parsed_experience_years or 0,
                            'parsed_education_level': candidate.parsed_education_level or '',
                            'parsed_location': candidate.parsed_location or '',
                            'parsed_summary': candidate.parsed_summary or '',
                        }
                        
                        job_data = {
                            'parsed_required_skills': job.parsed_required_skills or [],
                            'parsed_preferred_skills': job.parsed_preferred_skills or [],
                            'parsed_min_experience': job.parsed_min_experience or 0,
                            'parsed_max_experience': job.parsed_max_experience or 100,
                            'parsed_education_level': job.parsed_education_level or '',
                            'parsed_location': job.parsed_location or '',
                            'parsed_is_remote': job.parsed_is_remote or False,
                            'parsed_description': job.parsed_description or '',
                            'parsed_responsibilities': job.parsed_responsibilities or '',
                        }
                        
                        match_result = matcher.calculate_match(candidate_data, job_data)
                        
                        application.match_score = match_result['overall_score']
                        application.match_details = match_result
                        application.save()
                    except Exception as match_error:
                        print(f"Error calculating match: {match_error}")
                        # Continue even if matching fails
                    
                except Job.DoesNotExist:
                    return Response(
                        {'error': 'Job not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            serializer = CandidateSerializer(candidate)
            return Response({
                'message': 'Application submitted successfully!',
                'candidate': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in apply endpoint: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )