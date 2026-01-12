"""
Advanced Job Description Parser
Extracts structured data from job descriptions using NLP and pattern matching
"""

import re
import spacy
from typing import Dict, List, Set

class JobDescriptionParser:
    """
    Parses job descriptions to extract:
    - Required skills
    - Preferred skills
    - Qualifications (degrees, certifications)
    - Responsibilities
    - Benefits
    - Keywords
    """
    
    def __init__(self):
        # Load spaCy model
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            import os
            os.system('python -m spacy download en_core_web_sm')
            self.nlp = spacy.load('en_core_web_sm')
        
        # Comprehensive skill keywords
        self.skills_database = {
            'programming_languages': [
                'Python', 'JavaScript', 'Java', 'C++', 'C#', 'TypeScript',
                'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Scala',
                'R', 'MATLAB', 'Perl', 'Objective-C', 'Dart', 'Elixir'
            ],
            'web_frameworks': [
                'React', 'Angular', 'Vue', 'Django', 'Flask', 'FastAPI',
                'Express', 'Node.js', 'Spring', 'ASP.NET', 'Laravel',
                'Ruby on Rails', 'Next.js', 'Nuxt.js', 'Svelte', 'Ember'
            ],
            'databases': [
                'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra',
                'Oracle', 'SQL Server', 'SQLite', 'DynamoDB', 'Elasticsearch',
                'MariaDB', 'CouchDB', 'Neo4j', 'Firebase'
            ],
            'cloud_platforms': [
                'AWS', 'Azure', 'Google Cloud', 'GCP', 'Heroku', 'DigitalOcean',
                'IBM Cloud', 'Oracle Cloud', 'Alibaba Cloud'
            ],
            'devops_tools': [
                'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
                'Terraform', 'Ansible', 'Chef', 'Puppet', 'CircleCI', 'Travis CI'
            ],
            'data_science': [
                'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
                'Keras', 'OpenCV', 'NLTK', 'spaCy', 'Matplotlib', 'Seaborn',
                'Jupyter', 'Apache Spark', 'Hadoop'
            ],
            'mobile': [
                'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin',
                'Ionic', 'Swift UI', 'Jetpack Compose'
            ],
            'general_skills': [
                'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
                'CI/CD', 'TDD', 'OOP', 'Design Patterns', 'System Design',
                'Linux', 'Unit Testing', 'Integration Testing', 'API Development'
            ]
        }
        
        # Degree keywords
        self.degree_keywords = [
            'Bachelor', 'BS', 'BA', 'B.Sc', 'B.A', 'BSc', 'B.Tech', 'BTech',
            'Master', 'MS', 'MA', 'M.Sc', 'M.A', 'MSc', 'M.Tech', 'MTech', 'MBA',
            'PhD', 'Ph.D', 'Doctorate', 'Associate', 'Diploma'
        ]
        
        # Certification keywords
        self.certification_keywords = [
            'AWS Certified', 'Google Cloud Certified', 'Azure Certified',
            'PMP', 'CISSP', 'CEH', 'CompTIA', 'Certified Scrum Master',
            'CSM', 'CKA', 'CKAD', 'Oracle Certified', 'Red Hat Certified',
            'Salesforce Certified', 'ITIL', 'Six Sigma'
        ]
        
        # Benefit keywords
        self.benefit_keywords = [
            'health insurance', 'dental', 'vision', '401k', 'retirement',
            'paid time off', 'PTO', 'vacation', 'sick leave', 'parental leave',
            'maternity leave', 'paternity leave', 'flexible hours', 'remote work',
            'work from home', 'gym membership', 'learning budget', 'training',
            'professional development', 'tuition reimbursement', 'stock options',
            'equity', 'bonus', 'relocation assistance'
        ]
        
        # Section headers to identify different parts
        self.section_patterns = {
            'requirements': r'(?i)(requirements?|qualifications?|what we(?:\'re| are) looking for|you have)',
            'responsibilities': r'(?i)(responsibilities|duties|what you(?:\'ll| will) do|role|your mission)',
            'skills': r'(?i)(skills?|technical skills?|competenc(?:y|ies)|technologies)',
            'nice_to_have': r'(?i)(nice to have|preferred|bonus|plus|advantageous)',
            'benefits': r'(?i)(benefits?|what we offer|perks?|compensation)',
            'education': r'(?i)(education|degree|academic)'
        }
    
    def parse_job_description(self, description: str, requirements: str = "", 
                            nice_to_have: str = "") -> Dict:
        """
        Main parsing function
        Returns structured data extracted from job description
        """
        
        full_text = f"{description}\n\n{requirements}\n\n{nice_to_have}"
        
        result = {
            'parsed_required_skills': [],
            'parsed_preferred_skills': [],
            'parsed_qualifications': [],
            'parsed_responsibilities': [],
            'parsed_benefits': [],
            'keywords': []
        }
        
        # Extract skills
        required_skills, preferred_skills = self._extract_skills(
            description, requirements, nice_to_have
        )
        result['parsed_required_skills'] = list(required_skills)
        result['parsed_preferred_skills'] = list(preferred_skills)
        
        # Extract qualifications
        result['parsed_qualifications'] = self._extract_qualifications(full_text)
        
        # Extract responsibilities
        result['parsed_responsibilities'] = self._extract_responsibilities(description)
        
        # Extract benefits
        result['parsed_benefits'] = self._extract_benefits(full_text)
        
        # Generate keywords for search
        result['keywords'] = self._generate_keywords(full_text)
        
        return result
    
    def _extract_skills(self, description: str, requirements: str, 
                       nice_to_have: str) -> tuple:
        """Extract required and preferred skills"""
        
        required_skills = set()
        preferred_skills = set()
        
        # Combine all skills from database
        all_skills = []
        for category, skills in self.skills_database.items():
            all_skills.extend(skills)
        
        # Search for skills in different sections
        for skill in all_skills:
            # Case-insensitive search with word boundaries
            pattern = r'\b' + re.escape(skill) + r'\b'
            
            # Check in requirements
            if re.search(pattern, requirements, re.IGNORECASE) or \
               re.search(pattern, description, re.IGNORECASE):
                required_skills.add(skill)
            
            # Check in nice-to-have
            if re.search(pattern, nice_to_have, re.IGNORECASE):
                preferred_skills.add(skill)
        
        # Remove from preferred if in required
        preferred_skills = preferred_skills - required_skills
        
        return required_skills, preferred_skills
    
    def _extract_qualifications(self, text: str) -> List[str]:
        """Extract degree and certification requirements"""
        
        qualifications = []
        
        # Extract degree requirements
        for degree in self.degree_keywords:
            pattern = r'\b' + re.escape(degree) + r'[^.!?\n]{0,100}'
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = match.strip()
                if len(cleaned) > 5 and cleaned not in qualifications:
                    qualifications.append(cleaned)
        
        # Extract certifications
        for cert in self.certification_keywords:
            pattern = r'\b' + re.escape(cert) + r'[^.!?\n]{0,50}'
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = match.strip()
                if len(cleaned) > 5 and cleaned not in qualifications:
                    qualifications.append(cleaned)
        
        return qualifications[:10]  # Limit to top 10
    
    def _extract_responsibilities(self, description: str) -> List[str]:
        """Extract key responsibilities from job description"""
        
        responsibilities = []
        
        # Try to find responsibilities section
        resp_pattern = self.section_patterns['responsibilities']
        sections = re.split(resp_pattern, description, flags=re.IGNORECASE)
        
        if len(sections) > 1:
            # Get text after "Responsibilities" header
            resp_text = sections[-1]
            
            # Split by next section or take first 500 chars
            next_section_patterns = '|'.join([
                self.section_patterns['requirements'],
                self.section_patterns['skills'],
                self.section_patterns['nice_to_have']
            ])
            parts = re.split(next_section_patterns, resp_text, flags=re.IGNORECASE)
            resp_text = parts[0][:1000]
            
            # Extract bullet points or numbered items
            bullets = re.findall(r'[•\-\*\d+\.]\s*(.+?)(?=[•\-\*\d+\.]|$)', 
                               resp_text, re.DOTALL)
            
            for bullet in bullets:
                cleaned = bullet.strip()
                if 10 < len(cleaned) < 200:
                    responsibilities.append(cleaned)
        
        # If no structured responsibilities found, use NLP
        if not responsibilities:
            doc = self.nlp(description[:1000])
            for sent in doc.sents:
                text = sent.text.strip()
                # Look for sentences with action verbs
                if any(token.pos_ == 'VERB' for token in sent) and 10 < len(text) < 200:
                    if any(word in text.lower() for word in ['develop', 'design', 'manage', 
                           'lead', 'build', 'create', 'implement', 'maintain', 'work']):
                        responsibilities.append(text)
        
        return responsibilities[:8]  # Limit to top 8
    
    def _extract_benefits(self, text: str) -> List[str]:
        """Extract benefits and perks"""
        
        benefits = []
        
        # Try to find benefits section
        ben_pattern = self.section_patterns['benefits']
        sections = re.split(ben_pattern, text, flags=re.IGNORECASE)
        
        search_text = sections[-1][:1000] if len(sections) > 1 else text
        
        # Search for benefit keywords
        for benefit in self.benefit_keywords:
            pattern = r'\b' + re.escape(benefit) + r'\b'
            if re.search(pattern, search_text, re.IGNORECASE):
                # Capitalize first letter
                formatted = benefit.title()
                if formatted not in benefits:
                    benefits.append(formatted)
        
        return benefits[:15]  # Limit to top 15
    
    def _generate_keywords(self, text: str) -> List[str]:
        """Generate searchable keywords from job description"""
        
        keywords = set()
        
        # Process with spaCy
        doc = self.nlp(text.lower())
        
        # Extract important nouns and proper nouns
        for token in doc:
            if token.pos_ in ['NOUN', 'PROPN'] and len(token.text) > 2:
                if not token.is_stop and not token.is_punct:
                    keywords.add(token.text)
        
        # Extract named entities
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'SKILL']:
                keywords.add(ent.text.lower())
        
        # Add detected skills
        all_skills = []
        for skills in self.skills_database.values():
            all_skills.extend([s.lower() for s in skills])
        
        for skill in all_skills:
            if skill.lower() in text.lower():
                keywords.add(skill.lower())
        
        # Limit to most relevant keywords
        return sorted(list(keywords))[:50]


def test_parser():
    """Test the job parser with sample data"""
    
    parser = JobDescriptionParser()
    
    sample_description = """
    We are seeking a Senior Full-Stack Developer to join our growing team.
    
    Responsibilities:
    - Design and develop scalable web applications
    - Lead technical discussions and code reviews
    - Mentor junior developers
    - Collaborate with product team to define features
    
    Requirements:
    - 5+ years of professional software development experience
    - Strong proficiency in Python and JavaScript
    - Experience with React and Django
    - Familiarity with AWS cloud services
    - Bachelor's degree in Computer Science or related field
    
    Nice to Have:
    - Experience with Docker and Kubernetes
    - Knowledge of GraphQL
    - AWS Certified Solutions Architect certification
    
    Benefits:
    - Competitive salary and equity
    - Health insurance
    - Flexible work hours
    - Remote work options
    - Professional development budget
    """
    
    result = parser.parse_job_description(sample_description)
    
    print("Parsed Job Description:")
    print(f"Required Skills: {result['parsed_required_skills']}")
    print(f"Preferred Skills: {result['parsed_preferred_skills']}")
    print(f"Qualifications: {result['parsed_qualifications']}")
    print(f"Responsibilities: {result['parsed_responsibilities']}")
    print(f"Benefits: {result['parsed_benefits']}")
    print(f"Keywords: {result['keywords'][:10]}")


if __name__ == '__main__':
    test_parser()