import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <span className="footer__text">
          &copy; {new Date().getFullYear()} Vokation. All rights reserved.
        </span>
        <div className="footer__links">
          <span className="footer__link-disabled">Terms of Service</span>
          <span className="footer__link-disabled">Privacy Policy</span>
          <span className="footer__link-disabled">System Status</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
