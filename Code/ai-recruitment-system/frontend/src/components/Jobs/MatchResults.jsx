import React from 'react';
import { api } from '../../services/api';
import './MatchResults.css';

const MatchResults = ({ matchData, candidate, job, onClose, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = React.useState('analysis');

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

  // Helper to ensure lists are valid
  const getList = (list) => Array.isArray(list) ? list : [];

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
              <h2>{matchData.match_level} Match</h2>
              <p className="match-subtitle">
                {candidate?.name} → {job?.title}
              </p>
              <div className="candidate-quick-contact">
                {candidate?.email && <span>📧 {candidate.email}</span>}
                {candidate?.phone && <span>📱 {candidate.phone}</span>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="match-tabs">
            <button
              className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📊 Match Analysis
            </button>
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              📝 Candidate Profile
            </button>
          </div>

          {/* Content Area */}
          <div className="tab-content">

            {/* ANALYSIS TAB */}
            {activeTab === 'analysis' && (
              <div className="analysis-view fade-in">
                {/* Score Breakdown */}
                <div className="scores-section">
                  <h3>📊 Score Breakdown</h3>
                  <div className="score-bars">
                    {[
                      { label: 'Skills Match', score: matchData.skills_score },
                      { label: 'Experience', score: matchData.experience_score },
                      { label: 'Education', score: matchData.education_score },
                      { label: 'Location', score: matchData.location_score },
                      { label: 'Semantic Similarity', score: matchData.semantic_score }
                    ].map((item, idx) => (
                      <div className="score-bar-item" key={idx}>
                        <div className="score-label">
                          <span>{item.label}</span>
                          <span className="score-value">{item.score?.toFixed(1)}%</span>
                        </div>
                        <div className="score-bar-bg">
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${item.score}%`,
                              background: getScoreBarColor(item.score)
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="skills-analysis">
                  <h3>🔧 Skills Analysis</h3>

                  {getList(matchData.matched_skills).length > 0 && (
                    <div className="skills-group">
                      <h4>✅ Matched Skills</h4>
                      <div className="skills-tags">
                        {matchData.matched_skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag matched">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {getList(matchData.missing_skills).length > 0 && (
                    <div className="skills-group">
                      <h4>❌ Missing Skills</h4>
                      <div className="skills-tags">
                        {matchData.missing_skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag missing">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Insights */}
                <div className="insights-grid">
                  {getList(matchData.strengths).length > 0 && (
                    <div className="insights-section">
                      <h3>💪 Strengths</h3>
                      <ul className="insights-list strengths">
                        {matchData.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                      </ul>
                    </div>
                  )}

                  {getList(matchData.weaknesses).length > 0 && (
                    <div className="insights-section">
                      <h3>⚠️ Areas for Improvement</h3>
                      <ul className="insights-list weaknesses">
                        {matchData.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="profile-view fade-in">

                {/* Summary */}
                {candidate?.parsed_summary && (
                  <div className="profile-section">
                    <h3>📝 Professional Summary</h3>
                    <p className="summary-text">{candidate.parsed_summary}</p>
                  </div>
                )}

                {/* Links */}
                <div className="profile-section">
                  <h3>🔗 Professional Links</h3>
                  <div className="links-grid">
                    {candidate?.parsed_linkedin && (
                      <a href={candidate.parsed_linkedin} target="_blank" rel="noopener noreferrer" className="profile-link linkedin">
                        <span>in</span> LinkedIn Profile
                      </a>
                    )}
                    {candidate?.parsed_github && (
                      <a href={candidate.parsed_github} target="_blank" rel="noopener noreferrer" className="profile-link github">
                        <span>🐱</span> GitHub Profile
                      </a>
                    )}
                    {candidate?.parsed_portfolio && (
                      <a href={candidate.parsed_portfolio} target="_blank" rel="noopener noreferrer" className="profile-link portfolio">
                        <span>🌐</span> Portfolio
                      </a>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className="profile-section">
                  <h3>💼 Work Experience ({candidate?.parsed_experience_years || 0} Years)</h3>
                  <div className="timeline">
                    {getList(candidate?.parsed_experience).length > 0 ? (
                      candidate.parsed_experience.map((exp, idx) => (
                        <div className="timeline-item" key={idx}>
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <h4>{exp.title || 'Position'}</h4>
                            <span className="timeline-company">{exp.company || 'Unknown Company'}</span>
                            <span className="timeline-date">{exp.duration}</span>
                            <p className="timeline-desc">{exp.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">No experience data extracted.</p>
                    )}
                  </div>
                </div>

                {/* Education */}
                <div className="profile-section">
                  <h3>🎓 Education</h3>
                  <div className="timeline">
                    {getList(candidate?.parsed_education).length > 0 ? (
                      candidate.parsed_education.map((edu, idx) => (
                        <div className="timeline-item" key={idx}>
                          <div className="timeline-marker edu"></div>
                          <div className="timeline-content">
                            <h4>{edu.degree || 'Degree'}</h4>
                            <span className="timeline-company">{edu.institution || 'Institution'}</span>
                            <span className="timeline-date">{edu.year}</span>
                            <p className="timeline-desc">{edu.details}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">No education data extracted.</p>
                    )}
                  </div>
                </div>

                {/* All Skills */}
                <div className="profile-section">
                  <h3>🛠 Technical Skills</h3>

                  <div className="skill-category">
                    <h5>Languages</h5>
                    <div className="skills-tags">
                      {getList(candidate?.parsed_languages).map((s, i) => (
                        <span key={i} className="skill-tag extra">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="skill-category">
                    <h5>Frameworks & Tools</h5>
                    <div className="skills-tags">
                      {[...getList(candidate?.parsed_frameworks), ...getList(candidate?.parsed_tools)].map((s, i) => (
                        <span key={i} className="skill-tag extra">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Certifications & Projects */}
                <div className="profile-grid">
                  <div className="profile-section">
                    <h3>📜 Certifications</h3>
                    <ul className="simple-list">
                      {getList(candidate?.parsed_certifications).map((cert, i) => (
                        <li key={i}>{cert}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="profile-section">
                    <h3>🚀 Notable Projects</h3>
                    <ul className="simple-list">
                      {getList(candidate?.parsed_projects).map((proj, i) => (
                        <li key={i}>
                          <strong>{proj.name}</strong>
                          {proj.description && <p>{proj.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {/* Actions */}
            <div className="match-actions">
              <button
                className="btn-action btn-shortlist"
                onClick={() => onStatusUpdate('shortlisted')}
              >
                ⭐ Shortlist Candidate
              </button>
              <button
                className="btn-action btn-interview"
                onClick={() => onStatusUpdate('interviewed')}
              >
                📅 Schedule Interview
              </button>
              <button
                className="btn-action btn-reject"
                onClick={() => onStatusUpdate('rejected')}
              >
                ✕ Reject
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchResults;