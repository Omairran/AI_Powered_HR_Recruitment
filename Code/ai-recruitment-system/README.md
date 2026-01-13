# AI-Powered Recruitment System - Module 3
## AI-Powered Candidate-Job Matching Engine

**Module:** 3 - Intelligent Matching & Ranking System  
**Prerequisites:** Modules 1 & 2 completed  
**New Features:** AI matching algorithm, semantic similarity, candidate ranking

---

## 🎯 What's New in Module 3

### Backend Features
- ✅ Advanced AI matching algorithm with 5 scoring components
- ✅ Skills matching with synonym support
- ✅ Experience level matching
- ✅ Education qualification matching
- ✅ Location compatibility scoring
- ✅ Semantic similarity using NLP
- ✅ Weighted scoring system (customizable)
- ✅ Match insights and recommendations
- ✅ Bulk matching endpoints
- ✅ Top candidates ranking for jobs
- ✅ Top jobs ranking for candidates

### Frontend Features
- ✅ Beautiful match results visualization
- ✅ Score breakdown with progress bars
- ✅ Skills analysis (matched, missing, extra)
- ✅ Strengths and weaknesses identification
- ✅ HR Dashboard for viewing top matches
- ✅ Real-time filtering by match score
- ✅ Application status management
- ✅ Detailed match analytics modal

---

## 🚀 Installation Steps

### Step 1: Update Backend

Navigate to your backend:

```bash
cd ai-recruitment-system/backend
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Step 2: Create Matching Engine

```bash
# Create utils directory in jobs app (if not exists)
mkdir -p jobs/utils

# Create the matching engine file
# Windows:
type nul > jobs/utils/matching_engine.py

# macOS/Linux:
touch jobs/utils/matching_engine.py
```

**Copy the code from the `matching_engine.py` artifact.**

### Step 3: Create Matching Views

```bash
# Create matching views file
# Windows:
type nul > jobs/matching_views.py

# macOS/Linux:
touch jobs/matching_views.py
```

**Copy the code from the `matching_views.py` artifact.**

### Step 4: Update URLs

Edit `jobs/urls.py` and add:

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, JobApplicationViewSet
from .matching_views import MatchingViewSet  # ADD THIS

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'job-applications', JobApplicationViewSet, basename='job-application')
router.register(r'matching', MatchingViewSet, basename='matching')  # ADD THIS

urlpatterns = [
    path('', include(router.urls)),
]
```

### Step 5: Test Matching Engine

```bash
# Test the matching algorithm
cd jobs/utils
python matching_engine.py
```

You should see output like:
```
=== MATCHING RESULTS ===
Overall Score: 85.4%
Match Level: Great Match

Detailed Scores:
  Skills: 90.0%
  Experience: 100.0%
  Education: 100.0%
  Location: 100.0%
  Semantic: 52.3%

Matched Skills: ['Python', 'Django', 'React', 'PostgreSQL']
Missing Skills: ['Kubernetes']
...
```

### Step 6: Run Migrations (if needed)

```bash
cd ../..  # Back to backend root
python manage.py makemigrations
python manage.py migrate
```

### Step 7: Test API Endpoints

Start your server:

```bash
python manage.py runserver
```

Test the new endpoints:

```bash
# Calculate match between specific candidate and job
curl -X POST http://localhost:8000/api/matching/calculate/ \
  -H "Content-Type: application/json" \
  -d '{"candidate_id": 1, "job_id": 1}'

# Get top candidates for a job
curl http://localhost:8000/api/matching/top-candidates/1/?min_score=60

# Match candidate with all active jobs
curl -X POST http://localhost:8000/api/matching/bulk-match/ \
  -H "Content-Type: application/json" \
  -d '{"candidate_id": 1, "top_n": 5}'
```

---

## 🎨 Frontend Setup

### Step 1: Create Components

```bash
cd ../../frontend/src/components

# Create Jobs directory if not exists
mkdir -p Jobs

# Create new files
# Windows:
type nul > Jobs\MatchResults.jsx
type nul > Jobs\MatchResults.css
type nul > Jobs\HRDashboard.jsx
type nul > Jobs\HRDashboard.css

# macOS/Linux:
touch Jobs/MatchResults.jsx
touch Jobs/MatchResults.css
touch Jobs/HRDashboard.jsx
touch Jobs/HRDashboard.css
```

**Copy code from the artifacts:**
- `MatchResults.jsx` → `Jobs/MatchResults.jsx`
- `MatchResults.css` → `Jobs/MatchResults.css`
- `HRDashboard.jsx` → `Jobs/HRDashboard.jsx`
- `HRDashboard.css` → `Jobs/HRDashboard.css`

### Step 2: Update App.jsx

Edit `src/App.jsx`:

```jsx
import React, { useState } from 'react';
import CandidateApplicationForm from './components/CandidateApplicationForm';
import JobListings from './components/Jobs/JobListings';
import HRDashboard from './components/Jobs/HRDashboard';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('jobs');

  return (
    <div className="App">
      <nav className="main-nav">
        <div className="nav-container">
          <h2>🚀 AI Recruitment System</h2>
          <div className="nav-links">
            <button 
              onClick={() => setCurrentPage('jobs')}
              className={currentPage === 'jobs' ? 'active' : ''}
            >
              Browse Jobs
            </button>
            <button 
              onClick={() => setCurrentPage('apply')}
              className={currentPage === 'apply' ? 'active' : ''}
            >
              Apply as Candidate
            </button>
            <button 
              onClick={() => setCurrentPage('hr-dashboard')}
              className={currentPage === 'hr-dashboard' ? 'active' : ''}
            >
              HR Dashboard
            </button>
          </div>
        </div>
      </nav>

      {currentPage === 'jobs' && <JobListings />}
      {currentPage === 'apply' && <CandidateApplicationForm />}
      {currentPage === 'hr-dashboard' && <HRDashboard />}
    </div>
  );
}

export default App;
```

### Step 3: Test Frontend

```bash
cd ../..  # Back to frontend root
npm run dev
```

Visit http://localhost:5173 and test:
1. Navigate to "HR Dashboard"
2. Select a job
3. View ranked candidates
4. Click "View Analysis" on a candidate

---

## 🧪 Complete Testing Workflow

### Test 1: Automatic Matching on Application

When a candidate applies to a job, the match should be calculated automatically.

**Using Django Admin:**
1. Go to http://localhost:8000/admin/
2. Create a new JobApplication
3. Link candidate and job
4. Save
5. Check the `match_score` field - should be populated!

### Test 2: Manual Match Calculation

```bash
# Calculate match for existing application
curl -X POST http://localhost:8000/api/matching/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "job_id": 1
  }'
```

Expected response:
```json
{
  "candidate": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "job": {
    "id": 1,
    "title": "Senior Developer",
    "company": "Tech Corp"
  },
  "match_result": {
    "overall_score": 85.4,
    "skills_score": 90.0,
    "experience_score": 100.0,
    "education_score": 100.0,
    "location_score": 100.0,
    "semantic_score": 52.3,
    "matched_skills": ["Python", "Django", "React"],
    "missing_skills": ["Kubernetes"],
    "match_level": "Great Match",
    "strengths": [...],
    "weaknesses": [...],
    "recommendations": [...]
  }
}
```

### Test 3: Bulk Matching

Match a candidate against all active jobs:

```bash
curl -X POST http://localhost:8000/api/matching/bulk-match/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "top_n": 10
  }'
```

### Test 4: HR Dashboard Workflow

1. **Open HR Dashboard** at http://localhost:5173
2. **Click "HR Dashboard"** tab
3. **Select a job** from the job list
4. **View ranked candidates** - sorted by match score
5. **Filter by score** - try "75%+ (Great)" filter
6. **Click "View Analysis"** on top candidate
7. **See detailed breakdown**:
   - Overall score with circular progress
   - Individual component scores
   - Matched/missing skills
   - Strengths and weaknesses
   - Recommendations
8. **Test actions**:
   - Click "Shortlist Candidate"
   - Status should update to "shortlisted"
   - Try "Schedule Interview" button

### Test 5: Match Results Visualization

1. From HR Dashboard, click any candidate's "View Analysis"
2. Verify the following displays correctly:
   - Circular progress indicator
   - Score breakdown bars
   - Green "Matched Skills" tags
   - Red "Missing Skills" tags
   - Blue "Extra Skills" tags
   - Experience analysis
   - Strengths list
   - Weaknesses list
   - Recommendations

---

## 📊 Understanding the Matching Algorithm

### Scoring Components (Weights)

The matching engine uses 5 components with configurable weights:

| Component | Weight | Purpose |
|-----------|--------|---------|
| **Skills Match** | 40% | Required/preferred skills comparison |
| **Experience** | 25% | Years of experience vs requirements |
| **Education** | 15% | Degree level matching |
| **Location** | 10% | Location compatibility |
| **Semantic** | 10% | NLP-based similarity |

### Skills Matching Logic

```python
# The algorithm:
1. Extract candidate skills
2. Extract required + preferred job skills
3. Match with synonym support (JavaScript = js = JS)
4. Calculate:
   - Required skills match rate (80% weight)
   - Preferred skills match rate (20% weight)
5. Score = (required_rate * 0.8 + preferred_rate * 0.2) * 100
```

### Experience Matching Logic

```python
# Three scenarios:
1. Under-qualified (< min years)
   → Score = 100 - (gap * 20)  # 20 points per year gap
   
2. Over-qualified (> max years)
   → Score = 100 - (excess * 5)  # 5 points per year excess
   
3. Perfect match (within range)
   → Score = 100
```

### Education Matching

```python
# Degree hierarchy:
PhD/Doctorate = 5
Master/MBA = 4
Bachelor = 3
Associate = 2
Diploma = 1

# Scoring:
- Meets or exceeds: 100%
- One level below: 70%
- Below that: 40%
```

### Match Level Categories

| Score Range | Level | Emoji |
|-------------|-------|-------|
| 90-100% | Excellent Match | 🌟 |
| 75-89% | Great Match | ⭐ |
| 60-74% | Good Match | 👍 |
| 45-59% | Fair Match | 👌 |
| 0-44% | Poor Match | 💡 |

---

## 🎨 Customizing the Matching Algorithm

### Adjust Weights

Edit `jobs/utils/matching_engine.py`:

```python
# Change weights in __init__ method
self.weights = {
    'skills_match': 0.50,      # Increase skills importance
    'experience_match': 0.20,   # Decrease experience importance
    'education_match': 0.10,
    'location_match': 0.10,
    'semantic_match': 0.10,
}
```

### Add Skill Synonyms

```python
# Add to skill_synonyms dict
self.skill_synonyms = {
    # ... existing ...
    'vue': ['vue', 'vuejs', 'vue.js'],
    'angular': ['angular', 'angularjs'],
    # ... add more ...
}
```

### Modify Scoring Logic

```python
# In _match_experience method, change penalty rates:
if candidate_years < min_required:
    gap = min_required - candidate_years
    score = max(0, 100 - (gap * 15))  # Change from 20 to 15
```

---

## 🔧 Advanced Features

### Feature 1: Auto-Match on Application

To automatically calculate match when candidate applies, modify `candidates/views.py`:

```python
from jobs.utils.matching_engine import CandidateJobMatcher

class CandidateViewSet(viewsets.ModelViewSet):
    
    @action(detail=False, methods=['post'])
    def apply(self, request):
        # ... existing code ...
        
        # After creating/updating candidate:
        job_id = request.data.get('job_id')
        if job_id:
            from jobs.models import Job, JobApplication
            
            try:
                job = Job.objects.get(id=job_id)
                
                # Create application
                application = JobApplication.objects.create(
                    candidate=candidate,
                    job=job
                )
                
                # Calculate match automatically
                matcher = CandidateJobMatcher()
                candidate_data = {
                    'parsed_skills': candidate.parsed_skills or [],
                    'parsed_experience_years': candidate.parsed_experience_years or 0,
                    # ... other fields ...
                }
                
                job_data = {
                    'parsed_required_skills': job.parsed_required_skills or [],
                    # ... other fields ...
                }
                
                match_result = matcher.calculate_match(candidate_data, job_data)
                
                # Update application
                application.match_score = match_result['overall_score']
                application.match_details = match_result
                application.save()
                
            except Job.DoesNotExist:
                pass
        
        # ... rest of code ...
```

### Feature 2: Scheduled Re-matching

Create a management command to recalculate all matches:

```bash
# Create file: jobs/management/commands/recalculate_matches.py

from django.core.management.base import BaseCommand
from jobs.models import JobApplication
from jobs.utils.matching_engine import CandidateJobMatcher

class Command(BaseCommand):
    help = 'Recalculate match scores for all applications'
    
    def handle(self, *args, **options):
        matcher = CandidateJobMatcher()
        applications = JobApplication.objects.select_related('candidate', 'job')
        
        count = 0
        for app in applications:
            # Prepare data
            candidate_data = {...}
            job_data = {...}
            
            # Calculate match
            result = matcher.calculate_match(candidate_data, job_data)
            
            # Update
            app.match_score = result['overall_score']
            app.match_details = result
            app.save()
            
            count += 1
        
        self.stdout.write(f'Recalculated {count} matches')
```

Run with:
```bash
python manage.py recalculate_matches
```

---

## 📈 Performance Optimization

### Caching Match Results

For high-traffic systems, cache match calculations:

```python
from django.core.cache import cache

def calculate_match_cached(candidate_id, job_id):
    cache_key = f'match_{candidate_id}_{job_id}'
    
    # Try cache first
    result = cache.get(cache_key)
    if result:
        return result
    
    # Calculate if not cached
    matcher = CandidateJobMatcher()
    result = matcher.calculate_match(candidate_data, job_data)
    
    # Cache for 1 hour
    cache.set(cache_key, result, 3600)
    
    return result
```

### Background Processing with Celery

For bulk matching, use Celery:

```python
# tasks.py
from celery import shared_task

@shared_task
def calculate_match_async(candidate_id, job_id):
    matcher = CandidateJobMatcher()
    # ... calculate and save ...
```

---

## 🐛 Troubleshooting

### Issue: Match scores not calculating

**Check:**
1. spaCy model installed: `python -m spacy download en_core_web_sm`
2. Candidate has parsed data (skills, experience, etc.)
3. Job has parsed data (required_skills, etc.)
4. Check Django logs for errors

**Debug:**
```python
python manage.py shell
from jobs.utils.matching_engine import CandidateJobMatcher
matcher = CandidateJobMatcher()
# Test with sample data
```

### Issue: Semantic similarity too low

**Cause:** spaCy's word vectors have limitations with technical terms.

**Solution:** Increase weight of skills_match, decrease semantic_match:
```python
self.weights = {
    'skills_match': 0.50,    # Increase
    'semantic_match': 0.05,   # Decrease
}
```

### Issue: Frontend not showing match results

**Check:**
1. API endpoint responding: Test in browser/Postman
2. CORS configured correctly
3. Browser console for errors (F12)
4. React components imported correctly

---

## ✅ Module 3 Complete Checklist

- [ ] Matching engine created and tested
- [ ] Matching views created
- [ ] URLs updated with matching endpoints
- [ ] API endpoints tested (calculate, bulk-match, top-candidates)
- [ ] Frontend MatchResults component working
- [ ] HR Dashboard displaying ranked candidates
- [ ] Match score calculation automatic
- [ ] Filtering by minimum score working
- [ ] Detailed match analysis modal working
- [ ] Status update buttons working
- [ ] End-to-end workflow tested

---

## 🎯 What's Next: Future Enhancements

### Module 4: Enhanced Analytics Dashboard
- Visual charts and graphs
- Time-series analysis
- Funnel metrics
- Export reports

### Module 5: Interview Scheduling
- Calendar integration
- Automated emails
- Meeting links
- Interview feedback

### Module 6: Chatbot Assistant
- Answer candidate queries
- Provide application status
- HR quick lookups
- Multi-language support

### Module 7: Advanced ML Models
- Custom NER for resume parsing
- Deep learning for matching
- Predictive hiring success
- Bias detection

---

## 💡 Tips for Best Results

1. **Ensure Quality Data**: Better parsed resumes = better matches
2. **Tune Weights**: Adjust weights based on your hiring priorities
3. **Add Synonyms**: Expand skill_synonyms for your industry
4. **Monitor Performance**: Check match quality with HR feedback
5. **Regular Updates**: Re-parse and re-match when data changes

---

## 📞 Support

Congratulations! You now have a sophisticated AI-powered matching system that:

✅ Automatically ranks candidates for jobs  
✅ Provides detailed match analysis  
✅ Identifies strengths and gaps  
✅ Gives actionable recommendations  
✅ Supports bulk operations  
✅ Has beautiful visualizations

**Module 3 Complete! 🎉**

Ready for the next module? Let me know!