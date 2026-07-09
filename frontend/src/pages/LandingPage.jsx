import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import './LandingPage.css';

const LandingPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing__nav">
        <div className="landing__logo">
          <span>VOKATION</span>
        </div>
        <div className="landing__nav-links">
          {isLoaded && isSignedIn ? (
            <>
              <Link to="/dashboard" className="landing__nav-item">Dashboard</Link>
              <Link to="/integrations" className="landing__nav-item">Integrations</Link>
              <Link to="/team" className="landing__nav-item">Team</Link>
              <span className="landing__user-greeting">
                Active Session: {user.firstName}
              </span>
              <button onClick={handleSignOut} className="landing__btn landing__btn--logout">
                Terminate Session
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="landing__btn landing__btn--text">
                Sign In
              </Link>
              <Link to="/signup" className="landing__btn landing__btn--primary">
                Register Workspace
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing__hero">
        <h1 className="landing__title">
          Enterprise Data Integration Platform
        </h1>
        <p className="landing__subtitle">
          Establish unified data synchronization across enterprise endpoints, e-commerce channels, and payment systems. Run asynchronous synchronization operations to consolidate your intelligence in real-time.
        </p>
        <div className="landing__ctas">
          {isLoaded && isSignedIn ? (
            <Link to="/dashboard" className="landing__btn-hero landing__btn-hero--primary">
              Access Control Console
            </Link>
          ) : (
            <>
              <Link to="/signup" className="landing__btn-hero landing__btn-hero--primary">
                Initiate Trial
              </Link>
              <Link to="/pricing" className="landing__btn-hero landing__btn-hero--secondary">
                View Agreements
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Integrations Banner Strip */}
      <div className="landing__strip">
        <span className="landing__strip-item">Shopify</span>
        <span className="landing__strip-dot">•</span>
        <span className="landing__strip-item">Google Analytics</span>
        <span className="landing__strip-dot">•</span>
        <span className="landing__strip-item">Mailchimp</span>
      </div>

      {/* Platform Features Section */}
      <section className="landing__overview">
        <div className="landing__row">
          <div className="landing__col">
            <h2 className="landing__overview-title">
              Designed for Enterprise Infrastructure.
            </h2>
          </div>
          <div className="landing__col">
            <div className="landing__detail">
              <h3 className="landing__detail-title">Secure API Integrations</h3>
              <p className="landing__detail-text">
                Secure authentication protocols establish direct API connectivity, syncing operational metrics with enterprise-grade protection.
              </p>
            </div>
            <div className="landing__detail">
              <h3 className="landing__detail-title">Asynchronous Queue Management</h3>
              <p className="landing__detail-text">
                Backed by reliable message queues and background processes to schedule and execute high-throughput sync jobs without disruption.
              </p>
            </div>
            <div className="landing__detail">
              <h3 className="landing__detail-title">Granular Access Controls</h3>
              <p className="landing__detail-text">
                Coordinate organizational workflows by inviting teammates, assigning roles, and delegating permissions via a consolidated control board.
              </p>
            </div>
            <div className="landing__detail">
              <h3 className="landing__detail-title">Comprehensive Audit Trails</h3>
              <p className="landing__detail-text">
                Maintain accountability through real-time logging of system changes, job operations, and user access records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <p>&copy; {new Date().getFullYear()} Vokation. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
