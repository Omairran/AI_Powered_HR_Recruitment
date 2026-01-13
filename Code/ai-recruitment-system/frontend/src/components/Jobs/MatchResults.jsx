
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchResults.css';

const MatchResults = ({ candidateId, jobId, onClose }) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (candidateId && jobId) {
      calculateMatch();
    }
  }, [candidateId, jobId]);

  const calculateMatch = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/matching/calculate/`, {
        candidate_id: candidateId,
        job_id: jobId
      });
      setMatchData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error calculating match:', err);
      setError('Failed to calculate match score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#2196f3';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getMatchLevelEmoji = (level) => {
    if (level.includes('Excellent')) return '🌟';
    if (level.includes('Great')) return '⭐';
    if (level.includes('Good')) return '👍';
    if (level.includes('Fair')) return '👌';
    return '💡';
  };

  if (loading) {
    return (
      <div className="match-results-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Calculating AI match score...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-results-container">
        <div className="error-box">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button onClick={calculateMatch} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!matchData) return null;

  const { candidate, job, match_result } = matchData;

  return (
    <div className="match-results-container">
      <div className="match-header">
        <div className="match-title-section">
          <h2>
            {getMatchLevelEmoji(match_result.match_level)} AI Match Analysis
          </h2>
          <p className="match-subtitle">
            {candidate.name} × {job.title}
          </p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* Overall Score Card */}
      <div className="overall-score-card">
        <div className="score-circle" style={{ 
          background: `conic-gradient(${getScoreColor(match_result.overall_score)} ${match_result.overall_score * 3.6}deg, #e0e0e0 0deg)` 
        }}>
          <div className="score-inner">
            <div className="score-value">{match_result.overall_score}%</div>
            <div className="score-label">{match_result.match_level}</div>
          </div>
        </div>
        <div className="score-description">
          <h3>Overall Compatibility</h3>
          <p>Based on comprehensive AI analysis of skills, experience, education, and more</p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="detailed-scores">
        <h3>📊 Detailed Score Breakdown</h3>
        <div className="score-bars">
          <ScoreBar 
            label="Skills Match" 
            score={match_result.skills_score}
            icon="💻"
            weight="40%"
          />
          <ScoreBar 
            label="Experience" 
            score={match_result.experience_score}
            icon="📈"
            weight="25%"
          />
          <ScoreBar 
            label="Education" 
            score={match_result.education_score}
            icon="🎓"
            weight="15%"
          />
          <ScoreBar 
            label="Location" 
            score={match_result.location_score}
            icon="📍"
            weight="10%"
          />
          <ScoreBar 
            label="Semantic Match" 
            score={match_result.semantic_score}
            icon="🧠"
            weight="10%"
          />
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="skills-analysis">
        <div className="skills-section matched-skills">
          <h3>✅ Matched Skills ({match_result.matched_skills.length})</h3>
          <div className="skills-tags">
            {match_result.matched_skills.length > 0 ? (
              match_result.matched_skills.map((skill, idx) => (
                <span key={idx} className="skill-tag matched">{skill}</span>
              ))
            ) : (
              <p className="no-data">No exact skill matches found</p>
            )}
          </div>
        </div>

        {match_result.missing_skills.length > 0 && (
          <div className="skills-section missing-skills">
            <h3>❌ Missing Skills ({match_result.missing_skills.length})</h3>
            <div className="skills-tags">
              {match_result.missing_skills.map((skill, idx) => (
                <span key={idx} className="skill-tag missing">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {match_result.extra_skills.length > 0 && (
          <div className="skills-section extra-skills">
            <h3>➕ Additional Skills ({match_result.extra_skills.length})</h3>
            <div className="skills-tags">
              {match_result.extra_skills.map((skill, idx) => (
                <span key={idx} className="skill-tag extra">{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Experience Details */}
      {match_result.experience_details && (
        <div className="experience-section">
          <h3>💼 Experience Analysis</h3>
          <div className="experience-grid">
            <div className="experience-item">
              <span className="exp-label">Candidate Experience</span>
              <span className="exp-value">
                {match_result.experience_details.candidate_years} years
              </span>
            </div>
            <div className="experience-item">
              <span className="exp-label">Required Range</span>
              <span className="exp-value">
                {match_result.experience_details.required_min}-
                {match_result.experience_details.required_max} years
              </span>
            </div>
            <div className="experience-item">
              <span className="exp-label">Status</span>
              <span className={`exp-value status-${match_result.experience_details.status}`}>
                {match_result.experience_details.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      {match_result.strengths.length > 0 && (
        <div className="insights-section strengths">
          <h3>💪 Key Strengths</h3>
          <ul>
            {match_result.strengths.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {match_result.weaknesses.length > 0 && (
        <div className="insights-section weaknesses">
          <h3>⚠️ Areas of Concern</h3>
          <ul>
            {match_result.weaknesses.map((weakness, idx) => (
              <li key={idx}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {match_result.recommendations.length > 0 && (
        <div className="insights-section recommendations">
          <h3>💡 Recommendations</h3>
          <ul>
            {match_result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="match-actions">
        {match_result.overall_score >= 70 && (
          <button className="action-btn primary">
            🎯 Shortlist Candidate
          </button>
        )}
        <button className="action-btn secondary">
          📧 Send Message
        </button>
        <button className="action-btn secondary">
          📄 View Full Profile
        </button>
      </div>
    </div>
  );
};

// Score Bar Component
const ScoreBar = ({ label, score, icon, weight }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#2196f3';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="score-bar-container">
      <div className="score-bar-header">
        <span className="score-bar-label">
          {icon} {label}
        </span>
        <span className="score-bar-weight">{weight}</span>
        <span className="score-bar-value">{score.toFixed(1)}%</span>
      </div>
      <div className="score-bar-track">
        <div 
          className="score-bar-fill"
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );
};

export default MatchResults;