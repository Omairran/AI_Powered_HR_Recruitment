import React from 'react';
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="talent-scout-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <h3 className="footer-title">TalentScout</h3>
            <p className="footer-description">
              Revolutionizing the hiring process with AI-powered interviews and candidate assessment.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon">
                <FaLinkedin size={20} />
              </a>
              <a href="#" className="social-icon">
                <FaGithub size={20} />
              </a>
              <a href="#" className="social-icon">
                <FaTwitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Testimonials</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h3 className="footer-title">Our Services</h3>
            <ul className="footer-links">
              <li><a href="#">AI Interviews</a></li>
              <li><a href="#">Facial Analysis</a></li>
              <li><a href="#">Candidate Ranking</a></li>
              <li><a href="#">Automated Shortlisting</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="contact-info">
              <li>
                <FaEnvelope className="contact-icon" />
                <span>support@talentscout.ai</span>
              </li>
              <li>
                <FaPhone className="contact-icon" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li>
                <FaMapMarkerAlt className="contact-icon" />
                <span>123 Innovation Drive, Tech City, TC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} TalentScout. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;