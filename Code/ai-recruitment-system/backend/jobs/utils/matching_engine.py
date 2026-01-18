"""
AI-Powered Candidate-Job Matching Engine
Uses multiple scoring components to calculate match scores between candidates and jobs.
"""

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from typing import Dict, List, Tuple, Any


class CandidateJobMatcher:
    """
    Advanced matching engine that calculates compatibility scores between
    candidates and job postings using multiple factors.
    """
    
    def __init__(self):
        """Initialize the matcher with NLP model and configuration."""
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            print("⚠️  Warning: spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Scoring weights (must sum to 1.0)
        self.weights = {
            'skills_match': 0.40,      # 40% - Most important
            'experience_match': 0.25,   # 25%
            'education_match': 0.15,    # 15%
            'location_match': 0.10,     # 10%
            'semantic_match': 0.10,     # 10% - NLP-based similarity
        }
        
        # Skill synonyms for better matching
        self.skill_synonyms = {
            'python': ['python', 'py', 'python3'],
            'javascript': ['javascript', 'js', 'es6', 'ecmascript'],
            'react': ['react', 'reactjs', 'react.js'],
            'node': ['node', 'nodejs', 'node.js'],
            'django': ['django', 'django rest framework', 'drf'],
            'postgresql': ['postgresql', 'postgres', 'psql'],
            'mongodb': ['mongodb', 'mongo'],
            'sql': ['sql', 'mysql', 'mssql', 'sqlite'],
            'docker': ['docker', 'containerization'],
            'kubernetes': ['kubernetes', 'k8s'],
            'aws': ['aws', 'amazon web services'],
            'machine learning': ['machine learning', 'ml', 'ai'],
            'deep learning': ['deep learning', 'neural networks'],
        }
    
    def calculate_match(self, candidate_data: Dict[str, Any], 
                       job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive match score between candidate and job.
        
        Args:
            candidate_data: Dictionary with candidate information
            job_data: Dictionary with job requirements
            
        Returns:
            Dictionary with scores, analysis, and recommendations
        """
        results = {
            'overall_score': 0.0,
            'skills_score': 0.0,
            'experience_score': 0.0,
            'education_score': 0.0,
            'location_score': 0.0,
            'semantic_score': 0.0,
            'matched_skills': [],
            'missing_skills': [],
            'extra_skills': [],
            'match_level': '',
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }
        
        # Calculate individual component scores
        skills_result = self._match_skills(candidate_data, job_data)
        results['skills_score'] = skills_result['score']
        results['matched_skills'] = skills_result['matched']
        results['missing_skills'] = skills_result['missing']
        results['extra_skills'] = skills_result['extra']
        
        results['experience_score'] = self._match_experience(candidate_data, job_data)
        results['education_score'] = self._match_education(candidate_data, job_data)
        results['location_score'] = self._match_location(candidate_data, job_data)
        results['semantic_score'] = self._semantic_similarity(candidate_data, job_data)
        
        # Calculate weighted overall score
        results['overall_score'] = (
            results['skills_score'] * self.weights['skills_match'] +
            results['experience_score'] * self.weights['experience_match'] +
            results['education_score'] * self.weights['education_match'] +
            results['location_score'] * self.weights['location_match'] +
            results['semantic_score'] * self.weights['semantic_match']
        )
        
        # Determine match level
        results['match_level'] = self._get_match_level(results['overall_score'])
        
        # Generate insights
        results['strengths'] = self._identify_strengths(results, candidate_data, job_data)
        results['weaknesses'] = self._identify_weaknesses(results, candidate_data, job_data)
        results['recommendations'] = self._generate_recommendations(results, candidate_data, job_data)
        
        return results
    
    def _normalize_skill(self, skill: str) -> str:
        """Normalize skill name for better matching."""
        skill = skill.lower().strip()
        skill = re.sub(r'[^\w\s]', '', skill)
        skill = re.sub(r'\s+', ' ', skill)
        return skill
    
    def _are_skills_similar(self, skill1: str, skill2: str) -> bool:
        """Check if two skills are similar using synonyms."""
        skill1_norm = self._normalize_skill(skill1)
        skill2_norm = self._normalize_skill(skill2)
        
        # Direct match
        if skill1_norm == skill2_norm:
            return True
        
        # Check synonyms
        for base_skill, synonyms in self.skill_synonyms.items():
            if skill1_norm in synonyms and skill2_norm in synonyms:
                return True
        
        # Fuzzy match (one contains the other)
        if skill1_norm in skill2_norm or skill2_norm in skill1_norm:
            return True
        
        return False
    
    def _match_skills(self, candidate_data: Dict, job_data: Dict) -> Dict[str, Any]:
        """
        Match candidate skills against job requirements.
        Returns score and detailed skill analysis.
        """
        candidate_skills = set(candidate_data.get('parsed_skills', []))
        required_skills = set(job_data.get('parsed_required_skills', []))
        preferred_skills = set(job_data.get('parsed_preferred_skills', []))
        
        matched_required = []
        matched_preferred = []
        missing_required = []
        missing_preferred = []
        extra_skills = []
        
        # Match required skills
        for req_skill in required_skills:
            matched = False
            for cand_skill in candidate_skills:
                if self._are_skills_similar(req_skill, cand_skill):
                    matched_required.append(req_skill)
                    matched = True
                    break
            if not matched:
                missing_required.append(req_skill)
        
        # Match preferred skills
        for pref_skill in preferred_skills:
            matched = False
            for cand_skill in candidate_skills:
                if self._are_skills_similar(pref_skill, cand_skill):
                    matched_preferred.append(pref_skill)
                    matched = True
                    break
            if not matched:
                missing_preferred.append(pref_skill)
        
        # Find extra skills
        all_job_skills = required_skills | preferred_skills
        for cand_skill in candidate_skills:
            is_extra = True
            for job_skill in all_job_skills:
                if self._are_skills_similar(cand_skill, job_skill):
                    is_extra = False
                    break
            if is_extra:
                extra_skills.append(cand_skill)
        
        # Calculate score
        required_match_rate = (
            len(matched_required) / len(required_skills) 
            if required_skills else 1.0
        )
        
        preferred_match_rate = (
            len(matched_preferred) / len(preferred_skills)
            if preferred_skills else 0.0
        )
        
        # Weighted score: required skills are more important
        score = (required_match_rate * 0.8 + preferred_match_rate * 0.2) * 100
        
        return {
            'score': score,
            'matched': matched_required + matched_preferred,
            'missing': missing_required + missing_preferred,
            'extra': extra_skills
        }
    
    def _match_experience(self, candidate_data: Dict, job_data: Dict) -> float:
        """
        Match candidate experience against job requirements.
        Returns score out of 100.
        """
        candidate_years = candidate_data.get('parsed_experience_years', 0)
        min_required = job_data.get('parsed_min_experience', 0)
        max_preferred = job_data.get('parsed_max_experience', 100)
        
        if candidate_years >= min_required and candidate_years <= max_preferred:
            return 100.0
        elif candidate_years < min_required:
            # Under-qualified: penalty based on gap
            gap = min_required - candidate_years
            score = max(0, 100 - (gap * 20))  # 20 points per year gap
            return score
        else:
            # Over-qualified: small penalty
            excess = candidate_years - max_preferred
            score = max(50, 100 - (excess * 5))  # 5 points per year excess
            return score
    
    def _match_education(self, candidate_data: Dict, job_data: Dict) -> float:
        """
        Match candidate education against job requirements.
        Returns score out of 100.
        """
        education_levels = {
            'high school': 1,
            'diploma': 1,
            'associate': 2,
            'bachelor': 3,
            'master': 4,
            'mba': 4,
            'phd': 5,
            'doctorate': 5
        }
        
        candidate_edu = candidate_data.get('parsed_education_level', '').lower()
        required_edu = job_data.get('parsed_education_level', '').lower()
        
        if not required_edu:
            return 100.0  # No requirement
        
        candidate_level = 0
        for edu, level in education_levels.items():
            if edu in candidate_edu:
                candidate_level = max(candidate_level, level)
        
        required_level = 0
        for edu, level in education_levels.items():
            if edu in required_edu:
                required_level = max(required_level, level)
        
        if candidate_level >= required_level:
            return 100.0
        elif candidate_level == required_level - 1:
            return 70.0  # One level below
        else:
            return 40.0  # Below requirement
    
    def _match_location(self, candidate_data: Dict, job_data: Dict) -> float:
        """
        Match candidate location against job location.
        Returns score out of 100.
        """
        candidate_location = candidate_data.get('parsed_location', '').lower()
        job_location = job_data.get('parsed_location', '').lower()
        is_remote = job_data.get('parsed_is_remote', False)
        
        if is_remote:
            return 100.0
        
        if not job_location or not candidate_location:
            return 50.0  # Neutral if no data
        
        # Exact match
        if candidate_location == job_location:
            return 100.0
        
        # City match (if both contain the city name)
        candidate_parts = candidate_location.split(',')
        job_parts = job_location.split(',')
        
        for c_part in candidate_parts:
            for j_part in job_parts:
                if c_part.strip() in j_part.strip() or j_part.strip() in c_part.strip():
                    return 80.0
        
        return 30.0  # Different location
    
    def _semantic_similarity(self, candidate_data: Dict, job_data: Dict) -> float:
        """
        Calculate semantic similarity between candidate profile and job description.
        Uses NLP to understand context beyond keywords.
        """
        if not self.nlp:
            return 50.0  # Neutral score if spaCy not available
        
        # Combine candidate text
        candidate_text = ' '.join([
            candidate_data.get('parsed_summary', ''),
            ' '.join(candidate_data.get('parsed_skills', [])),
        ])
        
        # Combine job text
        job_text = ' '.join([
            job_data.get('parsed_description', ''),
            job_data.get('parsed_responsibilities', ''),
            ' '.join(job_data.get('parsed_required_skills', [])),
        ])
        
        if not candidate_text.strip() or not job_text.strip():
            return 50.0
        
        try:
            # Use spaCy's similarity (based on word vectors)
            doc1 = self.nlp(candidate_text[:1000000])  # Limit to 1M chars
            doc2 = self.nlp(job_text[:1000000])
            similarity = doc1.similarity(doc2)
            
            # Convert to percentage (similarity is 0-1)
            return similarity * 100
        except Exception as e:
            print(f"Semantic similarity error: {e}")
            return 50.0
    
    def _get_match_level(self, score: float) -> str:
        """Convert numeric score to match level category."""
        if score >= 90:
            return "Excellent Match"
        elif score >= 75:
            return "Great Match"
        elif score >= 60:
            return "Good Match"
        elif score >= 45:
            return "Fair Match"
        else:
            return "Poor Match"
    
    def _identify_strengths(self, results: Dict, candidate_data: Dict, 
                           job_data: Dict) -> List[str]:
        """Identify candidate's key strengths for this position."""
        strengths = []
        
        if results['skills_score'] >= 80:
            strengths.append(f"Strong skills match ({len(results['matched_skills'])} matched skills)")
        
        if results['experience_score'] >= 90:
            candidate_years = candidate_data.get('parsed_experience_years', 0)
            strengths.append(f"Excellent experience match ({candidate_years} years)")
        
        if results['education_score'] == 100:
            strengths.append("Meets education requirements")
        
        if results['location_score'] >= 80:
            strengths.append("Location compatible")
        
        if len(results['extra_skills']) > 3:
            strengths.append(f"Additional valuable skills ({len(results['extra_skills'])} extra skills)")
        
        return strengths
    
    def _identify_weaknesses(self, results: Dict, candidate_data: Dict,
                            job_data: Dict) -> List[str]:
        """Identify areas where candidate may need improvement."""
        weaknesses = []
        
        if results['skills_score'] < 60:
            weaknesses.append(f"Missing {len(results['missing_skills'])} key skills")
        
        if results['experience_score'] < 50:
            candidate_years = candidate_data.get('parsed_experience_years', 0)
            min_required = job_data.get('parsed_min_experience', 0)
            gap = min_required - candidate_years
            if gap > 0:
                weaknesses.append(f"Experience gap of {gap} years")
        
        if results['education_score'] < 70:
            weaknesses.append("Education level below preferred")
        
        if results['location_score'] < 50:
            weaknesses.append("Location may require relocation")
        
        return weaknesses
    
    def _generate_recommendations(self, results: Dict, candidate_data: Dict,
                                 job_data: Dict) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        if results['overall_score'] >= 75:
            recommendations.append("✅ Strong candidate - proceed to interview")
        elif results['overall_score'] >= 60:
            recommendations.append("👍 Good candidate - consider for shortlist")
        else:
            recommendations.append("💡 Review carefully - may need development")
        
        if results['missing_skills']:
            top_missing = results['missing_skills'][:3]
            recommendations.append(f"Skills to develop: {', '.join(top_missing)}")
        
        if results['experience_score'] < 70:
            recommendations.append("Consider offering training/mentorship program")
        
        if results['location_score'] < 70 and not job_data.get('parsed_is_remote'):
            recommendations.append("Discuss remote work or relocation support")
        
        return recommendations


# Test the matcher
if __name__ == "__main__":
    # Sample data for testing
    sample_candidate = {
        'parsed_skills': ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'],
        'parsed_experience_years': 5,
        'parsed_education_level': 'Bachelor in Computer Science',
        'parsed_location': 'Lahore, Pakistan',
        'parsed_summary': 'Experienced full-stack developer with expertise in Python and React'
    }
    
    sample_job = {
        'parsed_required_skills': ['Python', 'Django', 'React', 'PostgreSQL'],
        'parsed_preferred_skills': ['Docker', 'Kubernetes', 'AWS'],
        'parsed_min_experience': 3,
        'parsed_max_experience': 7,
        'parsed_education_level': 'Bachelor',
        'parsed_location': 'Lahore, Pakistan',
        'parsed_is_remote': False,
        'parsed_description': 'Looking for a full-stack developer to build web applications',
        'parsed_responsibilities': 'Develop and maintain Django backend and React frontend'
    }
    
    # Create matcher and calculate
    matcher = CandidateJobMatcher()
    result = matcher.calculate_match(sample_candidate, sample_job)
    
    # Print results
    print("\n" + "="*50)
    print("MATCHING RESULTS")
    print("="*50)
    print(f"\n📊 Overall Score: {result['overall_score']:.1f}%")
    print(f"🎯 Match Level: {result['match_level']}\n")
    
    print("Detailed Scores:")
    print(f"  Skills:    {result['skills_score']:.1f}%")
    print(f"  Experience: {result['experience_score']:.1f}%")
    print(f"  Education:  {result['education_score']:.1f}%")
    print(f"  Location:   {result['location_score']:.1f}%")
    print(f"  Semantic:   {result['semantic_score']:.1f}%")
    
    print(f"\n✅ Matched Skills ({len(result['matched_skills'])}):")
    print(f"  {', '.join(result['matched_skills'])}")
    
    print(f"\n❌ Missing Skills ({len(result['missing_skills'])}):")
    print(f"  {', '.join(result['missing_skills']) if result['missing_skills'] else 'None'}")
    
    print(f"\n➕ Extra Skills ({len(result['extra_skills'])}):")
    print(f"  {', '.join(result['extra_skills']) if result['extra_skills'] else 'None'}")
    
    print(f"\n💪 Strengths:")
    for strength in result['strengths']:
        print(f"  • {strength}")
    
    print(f"\n⚠️  Weaknesses:")
    for weakness in result['weaknesses']:
        print(f"  • {weakness}")
    
    print(f"\n💡 Recommendations:")
    for rec in result['recommendations']:
        print(f"  • {rec}")
    
    print("\n" + "="*50)