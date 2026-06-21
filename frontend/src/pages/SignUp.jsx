import React from 'react';
import { Navigate } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

const SignUpPage = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="auth-page" />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">MergeMetrics</h1>
        <SignUp 
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
              },
              card: {
                borderRadius: '0',
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
              },
              headerTitle: {
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
              },
              headerSubtitle: {
                fontFamily: 'Inter, sans-serif',
                fontWeight: '400',
              },
              formButtonPrimary: {
                backgroundColor: '#800000',
                borderRadius: '0',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
              },
              formButtonPrimary__hover: {
                backgroundColor: '#6B1D1D',
              },
              formFieldInput: {
                borderRadius: '0',
                fontFamily: 'Inter, sans-serif',
              },
              socialButtonsBlockButton: {
                borderRadius: '0',
                fontFamily: 'Inter, sans-serif',
              },
              footer: {
                fontFamily: 'Inter, sans-serif',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignUpPage;