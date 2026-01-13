"""
Advanced AI-Powered Candidate-Job Matching Engine
Uses multiple algorithms for comprehensive matching:
1. Skills matching with synonyms
2. Experience matching
3. Education matching
4. Location matching
5. Semantic similarity using NLP
"""

import re
import spacy
from typing import Dict, List, Tuple
from collections import Counter
import math

class CandidateJobMatcher:
    """
    Advanced matching engine that calculates compatibility scores
    between candidates and job postings
    """
    
    def __init__(self):
        # Load spaCy model for semantic similarity
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            import os
            os.system('python -m spacy download en_core_web_sm')
            self.nlp = spacy.load('en_core_web_sm')
        
        # Skill synonyms for better matching
        self.skill_synonyms = {
            'javascript': ['js', 'javascript', 'es6', 'ecmascript'],
            'python': ['python', 'python3', 'py'],
            'react': ['react', 'reactjs', 'react.js'],
            'node': ['node', 'nodejs', 'node.js'],
            'docker': ['docker', 'containerization'],
            'kubernetes': ['kubernetes', 'k8s'],
            'postgresql': ['postgresql', 'postgres', 'psql'],
            'mongodb': ['mongodb', 'mongo'],
            'aws': ['aws', 'amazon web services'],
            'gcp': ['gcp', 'google cloud', 'google cloud platform'],
            'azure': ['azure', 'microsoft azure'],
            'machine learning': ['machine learning', 'ml', 'ai'],
            'deep learning': ['deep learning', 'dl', 'neural networks'],
            'rest api': ['rest api', 'restful', 'rest'],
            'graphql': ['graphql', 'graph ql'],
            'typescript': ['typescript', 'ts'],
            'c++': ['c++', 'cpp', 'cplusplus'],
            'c#': ['c#', 'csharp', 'c sharp'],
        }
        
        # Weights for different matching components
        self.weights = {
            'skills_match': 0.40,        # 40% - Most important
            'experience_match': 0.25,    # 25%
            'education_match': 0.15,     # 15%
            'location_match': 0.10,      # 10%
            'semantic_match': 0.10,      # 10%
        }
    
    def calculate_match(self, candidate_data: Dict, job_data: Dict) -> Dict:
        """
        Main matching function that calculates overall compatibility
        
        Returns:
        {
            'overall_score': float (0-100),
            'skills_score': float,
            'experience_score': float,
            'education_score': float,
            'location_score': float,
            'semantic_score': float,
            'matched_skills': list,
            'missing_skills': list,
            'recommendations': list,
            'strengths': list,
            'weaknesses': list
        }
        """
        
        # Calculate individual scores
        skills_result = self._match_skills(candidate_data, job_data)
        experience_result = self._match_experience(candidate_data, job_data)
        education_result = self._match_education(candidate_data, job_data)
        location_result = self._match_location(candidate_data, job_data)
        semantic_result = self._semantic_similarity(candidate_data, job_data)
        
        # Calculate weighted overall score
        overall_score = (
            skills_result['score'] * self.weights['skills_match'] +
            experience_result['score'] * self.weights['experience_match'] +
            education_result['score'] * self.weights['education_match'] +
            location_result['score'] * self.weights['location_match'] +
            semantic_result['score'] * self.weights['semantic_match']
        )
        
        # Generate insights
        strengths = self._identify_strengths(
            skills_result, experience_result, education_result, location_result
        )
        weaknesses = self._identify_weaknesses(
            skills_result, experience_result, education_result
        )
        recommendations = self._generate_recommendations(weaknesses, job_data)
        
        return {
            'overall_score': round(overall_score, 2),
            'skills_score': round(skills_result['score'], 2),
            'experience_score': round(experience_result['score'], 2),
            'education_score': round(education_result['score'], 2),
            'location_score': round(location_result['score'], 2),
            'semantic_score': round(semantic_result['score'], 2),
            'matched_skills': skills_result['matched'],
            'missing_skills': skills_result['missing'],
            'extra_skills': skills_result['extra'],
            'experience_details': experience_result['details'],
            'education_details': education_result['details'],
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations,
            'match_level': self._get_match_level(overall_score)
        }
    
    def _match_skills(self, candidate: Dict, job: Dict) -> Dict:
        """
        Match candidate skills with job requirements
        Handles synonyms and case-insensitive matching
        """
        
        # Extract skills
        candidate_skills = set(
            skill.lower().strip() 
            for skill in candidate.get('parsed_skills', [])
        )
        
        required_skills = set(
            skill.lower().strip() 
            for skill in job.get('parsed_required_skills', [])
        )
        
        preferred_skills = set(
            skill.lower().strip() 
            for skill in job.get('parsed_preferred_skills', [])
        )
        
        # Match with synonyms
        matched_required = set()
        matched_preferred = set()
        
        for req_skill in required_skills:
            if self._is_skill_match(req_skill, candidate_skills):
                matched_required.add(req_skill)
        
        for pref_skill in preferred_skills:
            if self._is_skill_match(pref_skill, candidate_skills):
                matched_preferred.add(pref_skill)
        
        # Calculate score
        required_match_rate = (
            len(matched_required) / len(required_skills) 
            if required_skills else 1.0
        )
        
        preferred_match_rate = (
            len(matched_preferred) / len(preferred_skills) 
            if preferred_skills else 0.0
        )
        
        # Weighted score (required skills are more important)
        score = (required_match_rate * 0.8 + preferred_match_rate * 0.2) * 100
        
        # Identify missing and extra skills
        missing_required = required_skills - matched_required
        missing_preferred = preferred_skills - matched_preferred
        extra_skills = candidate_skills - required_skills - preferred_skills
        
        return {
            'score': score,
            'matched': list(matched_required | matched_preferred),
            'missing': list(missing_required | missing_preferred),
            'extra': list(extra_skills)[:10],  # Top 10 extra skills
            'required_match_rate': required_match_rate,
            'preferred_match_rate': preferred_match_rate
        }
    
    def _is_skill_match(self, skill: str, candidate_skills: set) -> bool:
        """Check if skill matches considering synonyms"""
        
        # Direct match
        if skill in candidate_skills:
            return True
        
        # Check synonyms
        for key, synonyms in self.skill_synonyms.items():
            if skill in synonyms:
                for synonym in synonyms:
                    if synonym in candidate_skills:
                        return True
        
        return False
    
    def _match_experience(self, candidate: Dict, job: Dict) -> Dict:
        """
        Match candidate experience with job requirements
        """
        
        candidate_years = candidate.get('parsed_experience_years', 0) or 0
        min_required = job.get('min_experience_years', 0) or 0
        max_required = job.get('max_experience_years', 50) or 50
        
        # Calculate score based on experience range
        if candidate_years < min_required:
            # Under-experienced (penalty based on gap)
            gap = min_required - candidate_years
            score = max(0, 100 - (gap * 20))  # 20 points per year gap
            status = 'under_qualified'
        elif candidate_years > max_required:
            # Over-experienced (slight penalty)
            excess = candidate_years - max_required
            score = max(70, 100 - (excess * 5))  # 5 points per year excess
            status = 'over_qualified'
        else:
            # Perfect range
            score = 100
            status = 'perfect_match'
        
        return {
            'score': score,
            'details': {
                'candidate_years': candidate_years,
                'required_min': min_required,
                'required_max': max_required,
                'status': status
            }
        }
    
    def _match_education(self, candidate: Dict, job: Dict) -> Dict:
        """
        Match candidate education with job requirements
        """
        
        candidate_education = candidate.get('parsed_education', [])
        job_qualifications = job.get('parsed_qualifications', [])
        
        if not job_qualifications:
            # No specific requirements
            return {
                'score': 100,
                'details': {'status': 'no_requirements'}
            }
        
        # Extract degree levels
        degree_hierarchy = {
            'phd': 5,
            'doctorate': 5,
            'master': 4,
            'mba': 4,
            'bachelor': 3,
            'associate': 2,
            'diploma': 1
        }
        
        candidate_level = 0
        for edu in candidate_education:
            edu_lower = edu.lower()
            for degree, level in degree_hierarchy.items():
                if degree in edu_lower:
                    candidate_level = max(candidate_level, level)
        
        required_level = 0
        for qual in job_qualifications:
            qual_lower = qual.lower()
            for degree, level in degree_hierarchy.items():
                if degree in qual_lower:
                    required_level = max(required_level, level)
        
        # Calculate score
        if candidate_level >= required_level:
            score = 100
            status = 'meets_requirements'
        elif candidate_level == required_level - 1:
            score = 70
            status = 'close_match'
        else:
            score = 40
            status = 'below_requirements'
        
        return {
            'score': score,
            'details': {
                'candidate_level': candidate_level,
                'required_level': required_level,
                'status': status
            }
        }
    
    def _match_location(self, candidate: Dict, job: Dict) -> Dict:
        """
        Match candidate location with job location
        """
        
        job_remote = job.get('is_remote', False)
        
        # If job is remote, location doesn't matter
        if job_remote:
            return {
                'score': 100,
                'details': {'status': 'remote_position'}
            }
        
        candidate_location = (candidate.get('parsed_location', '') or '').lower()
        job_location = (job.get('location', '') or '').lower()
        
        if not candidate_location or not job_location:
            return {
                'score': 50,
                'details': {'status': 'unknown'}
            }
        
        # Check for city/state match
        if candidate_location in job_location or job_location in candidate_location:
            score = 100
            status = 'same_location'
        else:
            # Check for same state/country
            score = 50
            status = 'different_location'
        
        return {
            'score': score,
            'details': {
                'candidate_location': candidate_location,
                'job_location': job_location,
                'status': status
            }
        }
    
    def _semantic_similarity(self, candidate: Dict, job: Dict) -> Dict:
        """
        Calculate semantic similarity between candidate profile and job description
        using spaCy's word vectors
        """
        
        # Build candidate text
        candidate_text = ' '.join([
            candidate.get('professional_summary', ''),
            ' '.join(candidate.get('parsed_skills', [])),
            ' '.join([exp.get('description', '') for exp in candidate.get('parsed_experience', [])])
        ])[:1000]  # Limit text length
        
        # Build job text
        job_text = ' '.join([
            job.get('description', ''),
            job.get('requirements', ''),
            ' '.join(job.get('parsed_required_skills', []))
        ])[:1000]
        
        if not candidate_text or not job_text:
            return {'score': 50, 'details': {'status': 'insufficient_data'}}
        
        # Calculate similarity using spaCy
        try:
            doc1 = self.nlp(candidate_text)
            doc2 = self.nlp(job_text)
            similarity = doc1.similarity(doc2)
            score = similarity * 100
        except:
            score = 50
        
        return {
            'score': score,
            'details': {'similarity': similarity if 'similarity' in locals() else 0.5}
        }
    
    def _identify_strengths(self, skills_result, experience_result, 
                           education_result, location_result) -> List[str]:
        """Identify candidate's strengths for this position"""
        
        strengths = []
        
        if skills_result['score'] >= 80:
            strengths.append(
                f"Excellent skill match with {len(skills_result['matched'])} "
                f"matching skills"
            )
        
        if experience_result['details']['status'] == 'perfect_match':
            strengths.append(
                f"Perfect experience level: {experience_result['details']['candidate_years']} years"
            )
        
        if education_result['score'] >= 90:
            strengths.append("Educational qualifications meet or exceed requirements")
        
        if location_result['score'] == 100:
            status = location_result['details']['status']
            if status == 'remote_position':
                strengths.append("Position offers remote work flexibility")
            else:
                strengths.append("Candidate is in the same location as job")
        
        if skills_result.get('extra'):
            strengths.append(
                f"Additional valuable skills: {', '.join(skills_result['extra'][:3])}"
            )
        
        return strengths
    
    def _identify_weaknesses(self, skills_result, experience_result, 
                            education_result) -> List[str]:
        """Identify areas where candidate may fall short"""
        
        weaknesses = []
        
        if skills_result['score'] < 60:
            missing_count = len(skills_result['missing'])
            weaknesses.append(
                f"Missing {missing_count} required/preferred skills"
            )
        
        if experience_result['details']['status'] == 'under_qualified':
            gap = (experience_result['details']['required_min'] - 
                   experience_result['details']['candidate_years'])
            weaknesses.append(
                f"Below minimum experience requirement by {gap} years"
            )
        
        if education_result['details']['status'] == 'below_requirements':
            weaknesses.append("Educational qualifications below job requirements")
        
        return weaknesses
    
    def _generate_recommendations(self, weaknesses: List[str], 
                                 job_data: Dict) -> List[str]:
        """Generate recommendations for improving match"""
        
        recommendations = []
        
        if not weaknesses:
            recommendations.append("Strong candidate! Consider for immediate interview.")
            return recommendations
        
        for weakness in weaknesses:
            if 'skills' in weakness.lower():
                recommendations.append(
                    "Consider training or certification programs to acquire missing skills"
                )
            elif 'experience' in weakness.lower():
                recommendations.append(
                    "Highlight relevant projects or internships that demonstrate capability"
                )
            elif 'education' in weakness.lower():
                recommendations.append(
                    "Consider pursuing relevant degree or certifications"
                )
        
        return recommendations
    
    def _get_match_level(self, score: float) -> str:
        """Categorize match quality"""
        
        if score >= 90:
            return 'Excellent Match'
        elif score >= 75:
            return 'Great Match'
        elif score >= 60:
            return 'Good Match'
        elif score >= 45:
            return 'Fair Match'
        else:
            return 'Poor Match'


def test_matcher():
    """Test the matching engine"""
    
    matcher = CandidateJobMatcher()
    
    # Sample candidate
    candidate = {
        'parsed_skills': ['Python', 'Django', 'React', 'PostgreSQL', 'Docker', 'AWS'],
        'parsed_experience_years': 5,
        'parsed_education': ['Bachelor of Science in Computer Science'],
        'parsed_location': 'San Francisco, CA',
        'professional_summary': 'Experienced full-stack developer with expertise in Python and JavaScript'
    }
    
    # Sample job
    job = {
        'parsed_required_skills': ['Python', 'Django', 'React', 'PostgreSQL'],
        'parsed_preferred_skills': ['Docker', 'Kubernetes', 'AWS'],
        'min_experience_years': 3,
        'max_experience_years': 7,
        'parsed_qualifications': ['Bachelor degree in Computer Science'],
        'location': 'San Francisco, CA',
        'is_remote': False,
        'description': 'Looking for a full-stack developer to build web applications'
    }
    
    result = matcher.calculate_match(candidate, job)
    
    print("=== MATCHING RESULTS ===")
    print(f"Overall Score: {result['overall_score']}%")
    print(f"Match Level: {result['match_level']}")
    print(f"\nDetailed Scores:")
    print(f"  Skills: {result['skills_score']}%")
    print(f"  Experience: {result['experience_score']}%")
    print(f"  Education: {result['education_score']}%")
    print(f"  Location: {result['location_score']}%")
    print(f"  Semantic: {result['semantic_score']}%")
    print(f"\nMatched Skills: {result['matched_skills']}")
    print(f"Missing Skills: {result['missing_skills']}")
    print(f"\nStrengths:")
    for strength in result['strengths']:
        print(f"  • {strength}")
    print(f"\nWeaknesses:")
    for weakness in result['weaknesses']:
        print(f"  • {weakness}")


if __name__ == '__main__':
    test_matcher()