"""
Enhanced Resume Parser using spaCy with comprehensive debugging.
"""
import re
import os
import sys
from typing import Dict, List, Optional
from datetime import datetime


class EnhancedResumeParser:
    """
    Advanced resume parser using spaCy for Named Entity Recognition.
    With extensive debugging and error handling.
    """
    
    # Comprehensive skill keywords
    PROGRAMMING_LANGUAGES = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby',
        'php', 'swift', 'kotlin', 'go', 'rust', 'scala', 'r', 'matlab',
        'perl', 'shell', 'bash', 'powershell', 'sql', 'html', 'css',
        'objective-c', 'dart', 'lua', 'groovy', 'haskell', 'clojure'
    ]
    
    FRAMEWORKS = [
        'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask',
        'spring', 'asp.net', 'laravel', 'rails', 'fastapi', 'nest.js', 'nestjs',
        'next.js', 'nextjs', 'nuxt.js', 'nuxtjs', 'svelte', 'ember', 'backbone', 'jquery',
        'bootstrap', 'tailwind', 'material-ui', 'tensorflow', 'pytorch',
        'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'flutter', 'react native'
    ]
    
    TOOLS = [
        'git', 'github', 'gitlab', 'bitbucket', 'docker', 'kubernetes', 'k8s',
        'jenkins', 'ci/cd', 'terraform', 'ansible', 'aws', 'azure', 'gcp',
        'jira', 'confluence', 'slack', 'vscode', 'visual studio', 'intellij', 'eclipse',
        'postman', 'swagger', 'nginx', 'apache', 'redis', 'elasticsearch',
        'rabbitmq', 'kafka', 'graphql', 'rest', 'restful', 'soap', 'microservices'
    ]
    
    DATABASES = [
        'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis', 'oracle', 'sqlite',
        'cassandra', 'dynamodb', 'mariadb', 'sql server', 'mssql', 'firebase',
        'neo4j', 'couchdb', 'influxdb'
    ]
    
    def __init__(self):
        """Initialize parser with spaCy model."""
        print("\n" + "="*60)
        print("INITIALIZING RESUME PARSER")
        print("="*60)
        
        self.nlp = None
        self.spacy_available = False
        self._load_spacy_model()
        
        print("="*60 + "\n")
    
    def _load_spacy_model(self):
        """Load spaCy NLP model with detailed error handling."""
        try:
            print("→ Step 1: Importing spaCy...")
            import spacy
            print("  ✓ spaCy imported successfully")
            print(f"  ✓ spaCy version: {spacy.__version__}")
            
            print("\n→ Step 2: Loading language model 'en_core_web_sm'...")
            try:
                self.nlp = spacy.load('en_core_web_sm')
                self.spacy_available = True
                print("  ✓ Model loaded successfully!")
                print(f"  ✓ Model name: {self.nlp.meta['name']}")
                print(f"  ✓ Model version: {self.nlp.meta['version']}")
                
            except OSError as e:
                print(f"  ✗ Model not found: {str(e)}")
                print("\n→ Step 3: Attempting to download model...")
                
                try:
                    import subprocess
                    result = subprocess.run(
                        [sys.executable, '-m', 'spacy', 'download', 'en_core_web_sm'],
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode == 0:
                        print("  ✓ Model downloaded successfully")
                        self.nlp = spacy.load('en_core_web_sm')
                        self.spacy_available = True
                        print("  ✓ Model loaded after download")
                    else:
                        print(f"  ✗ Download failed: {result.stderr}")
                        self._use_fallback()
                        
                except Exception as download_error:
                    print(f"  ✗ Download error: {str(download_error)}")
                    self._use_fallback()
                    
        except ImportError as e:
            print(f"  ✗ spaCy not installed: {str(e)}")
            print("\n  To install spaCy, run:")
            print("  pip install spacy")
            print("  python -m spacy download en_core_web_sm")
            self._use_fallback()
            
        except Exception as e:
            print(f"  ✗ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            self._use_fallback()
    
    def _use_fallback(self):
        """Use fallback mode without spaCy."""
        print("\n⚠ WARNING: Using fallback mode (regex-based parsing)")
        print("  This will work but with reduced accuracy for:")
        print("  - Name extraction")
        print("  - Company name detection")
        print("  - Location extraction")
        self.spacy_available = False
    
    def parse(self, file_path: str) -> Dict:
        """
        Main parsing method - extracts all information from resume.
        """
        print("\n" + "="*60)
        print(f"PARSING RESUME: {os.path.basename(file_path)}")
        print("="*60)
        
        try:
            # Step 1: Extract text
            print("\n→ Step 1: Extracting text from file...")
            text = self.extract_text(file_path)
            
            if not text:
                print("  ✗ FAILED: Could not extract text from file")
                return self._empty_result()
            
            print(f"  ✓ Extracted {len(text)} characters")
            print(f"  ✓ Text preview: {text[:100]}...")
            
            # Step 2: Parse information
            print("\n→ Step 2: Parsing information...")
            
            result = {}
            
            # Basic text
            result['text'] = text
            print("  ✓ Stored raw text")
            
            # Contact info
            print("\n  → Extracting contact information...")
            result['name'] = self.extract_name(text)
            print(f"    Name: {result['name'] or 'Not found'}")
            
            result['email'] = self.extract_email(text)
            print(f"    Email: {result['email'] or 'Not found'}")
            
            result['phone'] = self.extract_phone(text)
            print(f"    Phone: {result['phone'] or 'Not found'}")
            
            result['location'] = self.extract_location(text)
            print(f"    Location: {result['location'] or 'Not found'}")
            
            # Professional links
            print("\n  → Extracting professional links...")
            result['linkedin'] = self.extract_linkedin(text)
            print(f"    LinkedIn: {result['linkedin'] or 'Not found'}")
            
            result['github'] = self.extract_github(text)
            print(f"    GitHub: {result['github'] or 'Not found'}")
            
            result['portfolio'] = self.extract_portfolio(text)
            print(f"    Portfolio: {result['portfolio'] or 'Not found'}")
            
            result['other_links'] = self.extract_other_links(text)
            print(f"    Other links: {len(result['other_links'])} found")
            
            # Skills
            print("\n  → Extracting skills...")
            result['languages'] = self.extract_languages(text)
            print(f"    Languages: {len(result['languages'])} found - {result['languages'][:5]}")
            
            result['frameworks'] = self.extract_frameworks(text)
            print(f"    Frameworks: {len(result['frameworks'])} found - {result['frameworks'][:5]}")
            
            result['tools'] = self.extract_tools(text)
            print(f"    Tools: {len(result['tools'])} found - {result['tools'][:5]}")
            
            result['skills'] = self.extract_skills(text)
            print(f"    Total skills: {len(result['skills'])} found")
            
            # Experience
            print("\n  → Extracting experience...")
            result['experience'] = self.extract_experience(text)
            print(f"    Experience entries: {len(result['experience'])} found")
            
            result['total_experience_years'] = self.calculate_total_experience(text)
            print(f"    Total years: {result['total_experience_years'] or 'Not calculated'}")
            
            result['current_position'] = self.extract_current_position(text)
            print(f"    Current position: {result['current_position'] or 'Not found'}")
            
            result['current_company'] = self.extract_current_company(text)
            print(f"    Current company: {result['current_company'] or 'Not found'}")
            
            # Education
            print("\n  → Extracting education...")
            result['education'] = self.extract_education(text)
            print(f"    Education entries: {len(result['education'])} found")
            
            result['highest_degree'] = self.extract_highest_degree(text)
            print(f"    Highest degree: {result['highest_degree'] or 'Not found'}")
            
            result['university'] = self.extract_university(text)
            print(f"    University: {result['university'] or 'Not found'}")
            
            # Additional
            print("\n  → Extracting additional information...")
            result['certifications'] = self.extract_certifications(text)
            print(f"    Certifications: {len(result['certifications'])} found")
            
            result['projects'] = self.extract_projects(text)
            print(f"    Projects: {len(result['projects'])} found")
            
            result['summary'] = self.extract_summary(text)
            print(f"    Summary: {'Found' if result['summary'] else 'Not found'}")
            
            # Summary
            print("\n" + "-"*60)
            fields_found = sum(1 for v in result.values() if v and v != [] and v != '')
            print(f"✓ PARSING COMPLETE: {fields_found}/{len(result)} fields extracted")
            print("="*60 + "\n")
            
            return result
            
        except Exception as e:
            print(f"\n✗ PARSING FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._empty_result()
    
    def _empty_result(self):
        """Return empty result structure."""
        return {
            'text': '',
            'name': None,
            'email': None,
            'phone': None,
            'linkedin': None,
            'github': None,
            'portfolio': None,
            'other_links': [],
            'skills': [],
            'languages': [],
            'frameworks': [],
            'tools': [],
            'experience': [],
            'total_experience_years': None,
            'current_position': None,
            'current_company': None,
            'education': [],
            'highest_degree': None,
            'university': None,
            'certifications': [],
            'projects': [],
            'summary': None,
            'location': None,
        }
    
    def extract_text(self, file_path: str) -> str:
        """Extract raw text from resume file."""
        extension = os.path.splitext(file_path)[1].lower()
        print(f"    File type: {extension}")
        
        try:
            if extension == '.txt':
                return self._extract_from_txt(file_path)
            elif extension == '.pdf':
                return self._extract_from_pdf(file_path)
            elif extension in ['.docx', '.doc']:
                return self._extract_from_docx(file_path)
            else:
                print(f"    ✗ Unsupported file type: {extension}")
                return ""
        except Exception as e:
            print(f"    ✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ""
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            print(f"    ✓ TXT file read successfully")
            return text
        except Exception as e:
            print(f"    ✗ TXT read error: {str(e)}")
            return ""
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            import PyPDF2
            print(f"    → Using PyPDF2 version {PyPDF2.__version__}")
            
            text = ""
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                num_pages = len(pdf_reader.pages)
                print(f"    → PDF has {num_pages} pages")
                
                for i, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    text += page_text + "\n"
                    print(f"    → Page {i+1}: extracted {len(page_text)} characters")
            
            print(f"    ✓ PDF extracted successfully")
            return text
            
        except ImportError:
            print("    ✗ PyPDF2 not installed")
            print("    → Install with: pip install PyPDF2")
            return ""
        except Exception as e:
            print(f"    ✗ PDF error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ""
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            import docx
            print(f"    → Using python-docx")
            
            doc = docx.Document(file_path)
            text = ""
            para_count = 0
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
                    para_count += 1
            
            print(f"    → Extracted {para_count} paragraphs")
            print(f"    ✓ DOCX extracted successfully")
            return text
            
        except ImportError:
            print("    ✗ python-docx not installed")
            print("    → Install with: pip install python-docx")
            return ""
        except Exception as e:
            print(f"    ✗ DOCX error: {str(e)}")
            import traceback
            traceback.print_exc()
            return ""
    
    def extract_name(self, text: str) -> Optional[str]:
        """Extract candidate name using spaCy NER or fallback."""
        if self.spacy_available and self.nlp:
            try:
                # Process first few lines where name usually appears
                lines = text.split('\n')[:5]
                first_section = '\n'.join(lines)
                
                doc = self.nlp(first_section)
                
                # Look for PERSON entities
                for ent in doc.ents:
                    if ent.label_ == 'PERSON':
                        return ent.text.strip()
            except Exception as e:
                print(f"    ⚠ spaCy name extraction failed: {str(e)}")
        
        # Fallback: first non-empty line that looks like a name
        lines = text.split('\n')[:5]
        for line in lines:
            line = line.strip()
            if line and 2 <= len(line.split()) <= 4:
                if not any(char.isdigit() for char in line):
                    if '@' not in line and 'http' not in line.lower():
                        return line
        
        return None
    
    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address."""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None
    
    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number."""
        patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]
        
        return None
    
    def extract_linkedin(self, text: str) -> Optional[str]:
        """Extract LinkedIn profile URL."""
        pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+'
        matches = re.findall(pattern, text, re.IGNORECASE)
        
        if matches:
            url = matches[0]
            if not url.startswith('http'):
                url = 'https://' + url
            return url
        
        return None
    
    def extract_github(self, text: str) -> Optional[str]:
        """Extract GitHub profile URL."""
        pattern = r'(?:https?://)?(?:www\.)?github\.com/[\w-]+'
        matches = re.findall(pattern, text, re.IGNORECASE)
        
        if matches:
            url = matches[0]
            if not url.startswith('http'):
                url = 'https://' + url
            return url
        
        return None
    
    def extract_portfolio(self, text: str) -> Optional[str]:
        """Extract portfolio/personal website URL."""
        url_pattern = r'https?://[\w\.-]+\.[a-z]{2,}(?:/[\w\.-]*)*'
        urls = re.findall(url_pattern, text, re.IGNORECASE)
        
        for url in urls:
            # Skip common sites
            if any(site in url.lower() for site in ['linkedin', 'github', 'twitter', 'facebook', 'instagram']):
                continue
            return url
        
        return None
    
    def extract_other_links(self, text: str) -> List[str]:
        """Extract other professional links."""
        links = []
        
        # Twitter/X
        pattern = r'(?:https?://)?(?:www\.)?(?:twitter|x)\.com/[\w-]+'
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if not match.startswith('http'):
                match = 'https://' + match
            links.append(match)
        
        return list(set(links))
    
    def extract_languages(self, text: str) -> List[str]:
        """Extract programming languages."""
        text_lower = text.lower()
        found = []
        
        for lang in self.PROGRAMMING_LANGUAGES:
            pattern = r'\b' + re.escape(lang) + r'\b'
            if re.search(pattern, text_lower):
                # Capitalize properly
                if lang.upper() in ['HTML', 'CSS', 'SQL', 'PHP', 'R']:
                    found.append(lang.upper())
                else:
                    found.append(lang.title())
        
        return sorted(list(set(found)))
    
    def extract_frameworks(self, text: str) -> List[str]:
        """Extract frameworks and libraries."""
        text_lower = text.lower()
        found = []
        
        for framework in self.FRAMEWORKS:
            pattern = r'\b' + re.escape(framework) + r'\b'
            if re.search(pattern, text_lower):
                found.append(framework)
        
        return sorted(list(set(found)))
    
    def extract_tools(self, text: str) -> List[str]:
        """Extract tools and technologies."""
        text_lower = text.lower()
        found = []
        
        all_tools = self.TOOLS + self.DATABASES
        
        for tool in all_tools:
            pattern = r'\b' + re.escape(tool) + r'\b'
            if re.search(pattern, text_lower):
                # Uppercase for common acronyms
                if tool.upper() in ['AWS', 'GCP', 'CI/CD', 'REST', 'API', 'SQL', 'GIT', 'K8S']:
                    found.append(tool.upper())
                else:
                    found.append(tool.title())
        
        return sorted(list(set(found)))
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract all skills."""
        all_skills = (
            self.extract_languages(text) +
            self.extract_frameworks(text) +
            self.extract_tools(text)
        )
        return sorted(list(set(all_skills)))
    
    def extract_experience(self, text: str) -> List[Dict]:
        """Extract work experience entries."""
        experiences = []
        
        exp_section = self._extract_section(text, ['experience', 'work history', 'employment', 'professional experience'])
        
        if not exp_section:
            return experiences
        
        entries = re.split(r'\n\s*\n+', exp_section)
        
        for entry in entries:
            if len(entry.strip()) < 20:
                continue
            
            lines = entry.strip().split('\n')
            
            exp_data = {
                'title': lines[0].strip() if lines else None,
                'company': None,
                'duration': None,
                'description': entry.strip()
            }
            
            # Extract dates
            date_pattern = r'(\d{4})\s*[-–to]\s*(\d{4}|present|current)'
            date_matches = re.findall(date_pattern, entry, re.IGNORECASE)
            if date_matches:
                exp_data['duration'] = f"{date_matches[0][0]} - {date_matches[0][1]}"
            
            # Extract company using spaCy if available
            if self.spacy_available and self.nlp:
                try:
                    doc = self.nlp(entry[:200])
                    for ent in doc.ents:
                        if ent.label_ == 'ORG':
                            exp_data['company'] = ent.text
                            break
                except:
                    pass
            
            # Fallback: second line often has company
            if not exp_data['company'] and len(lines) > 1:
                exp_data['company'] = lines[1].strip()
            
            experiences.append(exp_data)
        
        return experiences[:5]
    
    def calculate_total_experience(self, text: str) -> Optional[float]:
        """Calculate total years of experience."""
        # Look for explicit mentions
        exp_pattern = r'(\d+)\+?\s*years?\s+(?:of\s+)?experience'
        matches = re.findall(exp_pattern, text, re.IGNORECASE)
        if matches:
            return float(matches[0])
        
        # Calculate from date ranges
        date_pattern = r'(\d{4})\s*[-–]\s*(\d{4}|present|current)'
        date_matches = re.findall(date_pattern, text, re.IGNORECASE)
        
        total_years = 0
        current_year = datetime.now().year
        
        for start, end in date_matches:
            start_year = int(start)
            end_year = current_year if end.lower() in ['present', 'current'] else int(end)
            years = end_year - start_year
            if 0 < years <= 50:
                total_years += years
        
        return float(total_years) if total_years > 0 else None
    
    def extract_current_position(self, text: str) -> Optional[str]:
        """Extract current or most recent position."""
        experiences = self.extract_experience(text)
        if experiences:
            return experiences[0].get('title')
        return None
    
    def extract_current_company(self, text: str) -> Optional[str]:
        """Extract current or most recent company."""
        experiences = self.extract_experience(text)
        if experiences:
            return experiences[0].get('company')
        return None
    
    def extract_education(self, text: str) -> List[Dict]:
        """Extract education history."""
        education = []
        
        edu_section = self._extract_section(text, ['education', 'academic', 'qualification'])
        
        if not edu_section:
            return education
        
        entries = re.split(r'\n\s*\n+', edu_section)
        
        for entry in entries:
            if len(entry.strip()) < 15:
                continue
            
            lines = entry.strip().split('\n')
            
            edu_data = {
                'degree': lines[0].strip() if lines else None,
                'institution': None,
                'year': None,
                'details': entry.strip()
            }
            
            # Extract year
            year_pattern = r'\b(19|20)\d{2}\b'
            years = re.findall(year_pattern, entry)
            if years:
                edu_data['year'] = years[-1]
            
            # Extract institution using spaCy if available
            if self.spacy_available and self.nlp:
                try:
                    doc = self.nlp(entry[:200])
                    for ent in doc.ents:
                        if ent.label_ == 'ORG':
                            edu_data['institution'] = ent.text
                            break
                except:
                    pass
            
            # Fallback: second line
            if not edu_data['institution'] and len(lines) > 1:
                edu_data['institution'] = lines[1].strip()
            
            education.append(edu_data)
        
        return education[:3]
    
    def extract_highest_degree(self, text: str) -> Optional[str]:
        """Extract highest degree."""
        education = self.extract_education(text)
        
        if not education:
            return None
        
        degree_priority = ['phd', 'doctorate', 'master', 'mba', 'bachelor']
        
        for priority in degree_priority:
            for edu in education:
                degree = edu.get('degree', '').lower()
                if priority in degree:
                    return edu.get('degree')
        
        return education[0].get('degree') if education else None
    
    def extract_university(self, text: str) -> Optional[str]:
        """Extract most recent university."""
        education = self.extract_education(text)
        if education:
            return education[0].get('institution')
        return None
    
    def extract_certifications(self, text: str) -> List[str]:
        """Extract professional certifications."""
        certs = []
        
        cert_section = self._extract_section(text, ['certification', 'certificate', 'licenses'])
        
        if not cert_section:
            return certs
        
        lines = cert_section.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) > 10 and not line.endswith(':'):
                line = re.sub(r'^[•\-\*\d\.\)]+\s*', '', line)
                if line:
                    certs.append(line)
        
        return certs[:10]
    
    def extract_projects(self, text: str) -> List[Dict]:
        """Extract notable projects."""
        projects = []
        
        proj_section = self._extract_section(text, ['project', 'portfolio'])
        
        if not proj_section:
            return projects
        
        entries = re.split(r'\n\s*\n+', proj_section)
        
        for entry in entries:
            if len(entry.strip()) < 20:
                continue
            
            lines = entry.strip().split('\n')
            
            proj_data = {
                'name': lines[0].strip() if lines else None,
                'description': entry.strip()
            }
            
            projects.append(proj_data)
        
        return projects[:5]
    
    def extract_summary(self, text: str) -> Optional[str]:
        """Extract professional summary."""
        summary_section = self._extract_section(
            text,
            ['summary', 'objective', 'profile', 'about', 'professional summary']
        )
        
        if summary_section:
            paragraphs = [p.strip() for p in summary_section.split('\n\n') if p.strip()]
            return paragraphs[0] if paragraphs else None
        
        return None
    
        
    def extract_location(self, text: str) -> Optional[str]:
        """Extract location/address (Pakistan-optimized)."""

        # 1️⃣ spaCy NER (primary)
        if self.spacy_available and self.nlp:
            try:
                lines = text.split('\n')[:10]
                first_section = '\n'.join(lines)

                doc = self.nlp(first_section)

                for ent in doc.ents:
                    if ent.label_ in ['GPE', 'LOC']:
                        return ent.text
            except:
                pass

        # 2️⃣ Pakistan cities fallback
        pakistan_cities = [
            "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
            "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
            "Hyderabad", "Bahawalpur", "Sukkur", "Abbottabad",
            "Mardan", "Swat", "Rahim Yar Khan"
        ]

        for city in pakistan_cities:
            pattern = rf'\b{city}\b'
            if re.search(pattern, text, re.IGNORECASE):
                return city

        # 3️⃣ City + Pakistan pattern
        city_country_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(Pakistan)\b'
        match = re.search(city_country_pattern, text, re.IGNORECASE)
        if match:
            return f"{match.group(1)}, Pakistan"

        # 4️⃣ Province detection
        provinces = ["Punjab", "Sindh", "KPK", "Khyber Pakhtunkhwa", "Balochistan"]
        for province in provinces:
            if province.lower() in text.lower():
                return province

        return None



    def _extract_section(self, text: str, keywords: List[str]) -> Optional[str]:
        """Extract a section from resume based on keywords."""
        text_lower = text.lower()

        for keyword in keywords:
            patterns = [
                rf'\n\s*{keyword}s?\s*[:\n]',
                rf'\n\s*{keyword.upper()}S?\s*[:\n]',
            ]

            for pattern in patterns:
                match = re.search(pattern, text_lower)

                if match:
                    start = match.end()

                    next_section = re.search(
                        r'\n\s*(?:[A-Z][A-Z\s]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[:\n]',
                        text[start:]
                    )

                    if next_section:
                        end = start + next_section.start()
                        return text[start:end].strip()
                    else:
                        return text[start:].strip()

        return None


# =========================
# Convenience function
# =========================

def parse_resume(file_path: str) -> Dict:
    """Parse a resume file and extract all information."""
    parser = EnhancedResumeParser()
    return parser.parse(file_path)
