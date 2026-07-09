import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

const Login = () => {
  const navigate = useNavigate();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  
  const [step, setStep] = useState('email'); // 'email', 'password', 'otp', 'mfa'
  const [factors, setFactors] = useState({ emailCode: null, password: null });
  const [secondFactors, setSecondFactors] = useState({ email: null, phone: null, totp: null });
  const [mfaStrategy, setMfaStrategy] = useState(''); // 'email_code', 'phone_code', 'totp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthLoaded) {
    return <div className="auth-page" />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignInResult = async (result) => {
    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
      navigate('/dashboard');
      return;
    }

    if (result.status === 'needs_second_factor') {
      const emailFactor = result.supportedSecondFactors.find(
        (f) => f.strategy === 'email_code'
      );
      const phoneFactor = result.supportedSecondFactors.find(
        (f) => f.strategy === 'phone_code'
      );
      const totpFactor = result.supportedSecondFactors.find(
        (f) => f.strategy === 'totp'
      );

      setSecondFactors({ email: emailFactor, phone: phoneFactor, totp: totpFactor });

      if (emailFactor) {
        setMfaStrategy('email_code');
        await prepareMfa('email_code');
      } else if (phoneFactor) {
        setMfaStrategy('phone_code');
        await prepareMfa('phone_code');
      } else if (totpFactor) {
        setMfaStrategy('totp');
        setStep('mfa');
      } else {
        setError('Multi-factor authentication is required, but no supported second factor strategies were found.');
      }
      return;
    }

    setError(`Authentication status: ${result.status}. Sign-in could not be completed.`);
  };

  const prepareMfa = async (strategy) => {
    try {
      await signIn.prepareSecondFactor({ strategy });
      setStep('mfa');
    } catch (err) {
      console.error('Clerk prepare second factor error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to send second-factor verification code.');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
      });

      if (result.status === 'needs_second_factor') {
        await handleSignInResult(result);
        return;
      }

      const emailCodeFactor = result.supportedFirstFactors.find(
        (f) => f.strategy === 'email_code'
      );
      const passwordFactor = result.supportedFirstFactors.find(
        (f) => f.strategy === 'password'
      );

      setFactors({ emailCode: emailCodeFactor, password: passwordFactor });

      if (passwordFactor) {
        setStep('password');
      } else if (emailCodeFactor) {
        await prepareOtp(emailCodeFactor);
      } else {
        setError('No supported authentication methods found for this account.');
      }
    } catch (err) {
      console.error('Clerk email check error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to start sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const prepareOtp = async (factor) => {
    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: factor.emailAddressId,
      });
      setStep('otp');
    } catch (err) {
      console.error('Clerk prepare OTP error:', err);
      setError(err.errors?.[0]?.longMessage || 'Failed to send verification code.');
    }
  };

  const handleSendOtpInstead = async () => {
    if (!factors.emailCode) return;
    setLoading(true);
    setError('');
    await prepareOtp(factors.emailCode);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      });

      await handleSignInResult(result);
    } catch (err) {
      console.error('Clerk password submit error:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otpCode,
      });

      await handleSignInResult(result);
    } catch (err) {
      console.error('Clerk OTP verification error:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: mfaStrategy,
        code: mfaCode,
      });

      await handleSignInResult(result);
    } catch (err) {
      console.error('Clerk MFA verification error:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid second-factor code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!isSignInLoaded) return;
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  const handleGoBack = () => {
    setStep('email');
    setPassword('');
    setOtpCode('');
    setMfaCode('');
    setError('');
  };

  const getMfaInstructions = () => {
    if (mfaStrategy === 'email_code') {
      return `We sent a 6-digit verification code to your email.`;
    }
    if (mfaStrategy === 'phone_code') {
      return `We sent a 6-digit verification code to your phone.`;
    }
    if (mfaStrategy === 'totp') {
      return `Enter the 6-digit verification code from your authenticator app.`;
    }
    return 'Enter your second-factor verification code.';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-logo">VOKATION</h1>
        
        {step === 'email' && (
          <>
            <h2 className="auth-title">Workspace Authentication</h2>
            <p className="auth-subtitle">Provide your email address to access the console.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleEmailSubmit} className="auth-form">
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

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading || !isSignInLoaded}
              >
                {loading ? 'Continuing...' : 'Continue'}
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
              onClick={handleGoogleSignIn}
              disabled={loading || !isSignInLoaded}
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
              <span className="auth-footer-text">New workspace?</span>
              <Link to="/signup" className="auth-footer-link">
                Sign up
              </Link>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <h2 className="auth-title">Enter Password</h2>
            <p className="auth-subtitle">Providing credentials for {email}</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handlePasswordSubmit} className="auth-form">
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
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {factors.emailCode && (
              <button
                type="button"
                className="auth-btn"
                style={{ marginTop: '10px' }}
                onClick={handleSendOtpInstead}
                disabled={loading}
              >
                Sign in with verification code instead
              </button>
            )}

            <div className="auth-footer">
              <button 
                type="button" 
                className="auth-footer-btn"
                onClick={handleGoBack}
                disabled={loading}
              >
                Go Back
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="auth-title">Verify Email</h2>
            <p className="auth-subtitle">We sent a 6-digit verification code to {email}.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleOtpSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Verification Code</label>
                <input
                  type="text"
                  className="auth-input auth-input--code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder="••••••"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading}
              >
                {loading ? 'Verifying Code...' : 'Verify & Login'}
              </button>
            </form>

            <div className="auth-footer">
              <button 
                type="button" 
                className="auth-footer-btn"
                onClick={handleGoBack}
                disabled={loading}
              >
                Go Back
              </button>
            </div>
          </>
        )}

        {step === 'mfa' && (
          <>
            <h2 className="auth-title">Two-Factor Verification</h2>
            <p className="auth-subtitle">{getMfaInstructions()}</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleMfaSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Verification Code</label>
                <input
                  type="text"
                  className="auth-input auth-input--code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  placeholder="••••••"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn auth-btn--primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              <button 
                type="button" 
                className="auth-footer-btn"
                onClick={handleGoBack}
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

export default Login;