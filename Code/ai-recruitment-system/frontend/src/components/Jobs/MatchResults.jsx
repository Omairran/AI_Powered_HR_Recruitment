import React from 'react';
import './MatchResults.css';

const MatchResults = ({ matchData, candidate, job, onClose }) => {
  if (!matchData) return null;

  const getMatchEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 75) return '⭐';
    if (score >= 60) return '👍';
    if (score >= 45) return '👌';
    return '💡';
  };

  const getMatchColor = (score) => {
    if (score >= 90) return '#27ae60';
    if (score >= 75) return '#2ecc71';
    if (score >= 60) return '#3498db';
    if (score >= 45) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--info)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="match-results-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="match-results-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>✕</button>

          {/* Header */}
          <div className="match-header">
            <div className="match-score-circle" style={{ borderColor: getMatchColor(matchData.overall_score) }}>
              <span className="score-emoji">{getMatchEmoji(matchData.overall_score)}</span>
              <span className="score-number">{matchData.overall_score?.toFixed(1)}%</span>
            </div>
            <div className="match-title">
              <h2>{matchData.match_level}</h2>
              <p className="match-subtitle">
                {candidate?.name} → {job?.title}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="scores-section">
            <h3>📊 Score Breakdown</h3>
            <div className="score-bars">
              <div className="score-bar-item">
                <div className="score-label">
                  <span>Skills Match</span>
                  <span className="score-value">{matchData.skills_score?.toFixed(1)}%</span>
                </div>
                <div className="score-bar-bg">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      width: `${matchData.skills_score}%`,
                      background: getScoreBarColor(matchData.skills_score)
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-bar-item">
                <div className="score-label">
                  <span>Experience</span>
                  <span className="score-value">{matchData.experience_score?.toFixed(1)}%</span>
                </div>
                <div className="score-bar-bg">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      width: `${matchData.experience_score}%`,
                      background: getScoreBarColor(matchData.experience_score)
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-bar-item">
                <div className="score-label">
                  <span>Education</span>
                  <span className="score-value">{matchData.education_score?.toFixed(1)}%</span>
                </div>
                <div className="score-bar-bg">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      width: `${matchData.education_score}%`,
                      background: getScoreBarColor(matchData.education_score)
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-bar-item">
                <div className="score-label">
                  <span>Location</span>
                  <span className="score-value">{matchData.location_score?.toFixed(1)}%</span>
                </div>
                <div className="score-bar-bg">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      width: `${matchData.location_score}%`,
                      background: getScoreBarColor(matchData.location_score)
                    }}
                  ></div>
                </div>
              </div>

              <div className="score-bar-item">
                <div className="score-label">
                  <span>Semantic Similarity</span>
                  <span className="score-value">{matchData.semantic_score?.toFixed(1)}%</span>
                </div>
                <div className="score-bar-bg">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      width: `${matchData.semantic_score}%`,
                      background: getScoreBarColor(matchData.semantic_score)
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="skills-analysis">
            <h3>🔧 Skills Analysis</h3>
            
            {matchData.matched_skills && matchData.matched_skills.length > 0 && (
              <div className="skills-group">
                <h4>✅ Matched Skills ({matchData.matched_skills.length})</h4>
                <div className="skills-tags">
                  {matchData.matched_skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag matched">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {matchData.missing_skills && matchData.missing_skills.length > 0 && (
              <div className="skills-group">
                <h4>❌ Missing Skills ({matchData.missing_skills.length})</h4>
                <div className="skills-tags">
                  {matchData.missing_skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag missing">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {matchData.extra_skills && matchData.extra_skills.length > 0 && (
              <div className="skills-group">
                <h4>➕ Additional Skills ({matchData.extra_skills.length})</h4>
                <div className="skills-tags">
                  {matchData.extra_skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag extra">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Strengths */}
          {matchData.strengths && matchData.strengths.length > 0 && (
            <div className="insights-section">
              <h3>💪 Strengths</h3>
              <ul className="insights-list strengths">
                {matchData.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {matchData.weaknesses && matchData.weaknesses.length > 0 && (
            <div className="insights-section">
              <h3>⚠️ Areas for Improvement</h3>
              <ul className="insights-list weaknesses">
                {matchData.weaknesses.map((weakness, idx) => (
                  <li key={idx}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {matchData.recommendations && matchData.recommendations.length > 0 && (
            <div className="insights-section">
              <h3>💡 Recommendations</h3>
              <ul className="insights-list recommendations">
                {matchData.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="match-actions">
            <button className="btn-action btn-shortlist">
              ⭐ Shortlist Candidate
            </button>
            <button className="btn-action btn-interview">
              📅 Schedule Interview
            </button>
            <button className="btn-action btn-reject">
              ✕ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchResults;