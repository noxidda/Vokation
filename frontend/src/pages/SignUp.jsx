import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthLoaded) {
    return <div className="auth-page" />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      }
    } catch (err) {
      console.error('Clerk signup create error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to initialize sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/dashboard');
      } else {
        console.warn('Sign up status incomplete:', completeSignUp.status);
        setError('Sign up is incomplete. Please contact support or try again.');
      }
    } catch (err) {
      console.error('Clerk verification error:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid or expired code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!isSignUpLoaded) return;
    signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-logo">VOKATION</h1>
        
        {!pendingVerification ? (
          <>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Establish an organization namespace and primary admin session.</p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@company.com"
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading || !isSignUpLoaded}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider-line"></span>
              <span className="auth-divider-text">or</span>
              <span className="auth-divider-line"></span>
            </div>

            <button
              type="button"
              className="auth-btn auth-btn--google"
              onClick={handleGoogleSignUp}
              disabled={loading || !isSignUpLoaded}
            >
              <svg className="auth-google-icon" viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.842.95 15.114 0 12 0 7.354 0 3.307 2.67 1.242 6.56l4.024 3.205z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 15.34c-1.07.726-2.427 1.16-4.04 1.16-2.927 0-5.418-1.981-6.302-4.64L1.64 15.08c2.09 4.137 6.37 7 11.36 7 3.078 0 5.845-1.01 7.945-2.74l-4.904-4z"
                />
                <path
                  fill="#4285F4"
                  d="M24 12.273c0-.873-.082-1.709-.232-2.523H12v4.773h6.727a5.745 5.745 0 0 1-2.495 3.773l4.905 4C21.036 20.373 24 16.71 24 12.273z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.738 11.86A7.05 7.05 0 0 1 5.266 9.765L1.242 6.56A11.895 11.895 0 0 0 0 12c0 1.936.464 3.764 1.282 5.38l4.456-3.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="auth-footer">
              <span className="auth-footer-text">Already have an account?</span>
              <Link to="/login" className="auth-footer-link">
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="auth-title">Verify Email</h2>
            <p className="auth-subtitle">We sent a 6-digit verification code to {email}.</p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Verification Code</label>
                <input
                  type="text"
                  className="auth-input auth-input--code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="••••••"
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading || !isSignUpLoaded}
              >
                {loading ? 'Verifying Code...' : 'Verify & Login'}
              </button>
            </form>

            <div className="auth-footer">
              <button 
                type="button" 
                className="auth-footer-btn"
                onClick={() => setPendingVerification(false)}
                disabled={loading}
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;