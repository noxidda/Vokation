import React from 'react';
import { Navigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

const Login = () => {
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
        <SignIn 
          appearance={{
            variables: {
              colorPrimary: '#8b5cf6',
              colorText: '#e2d9f3',
              colorTextSecondary: '#a197b4',
              colorBackground: '#0c0816',
              colorInputBackground: '#140e24',
              colorInputText: '#ffffff',
              colorBorder: 'rgba(139, 92, 246, 0.2)',
              fontFamily: 'Raleway, Inter, sans-serif',
            },
            elements: {
              rootBox: {
                width: '100%',
              },
              card: {
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                width: '100%',
                padding: '0',
              },
              headerTitle: {
                color: '#ffffff',
                fontWeight: '700',
              },
              headerSubtitle: {
                color: '#a197b4',
              },
              socialButtonsBlockButton: {
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(139, 92, 246, 0.15)',
                color: '#ffffff',
                borderRadius: '6px',
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              },
              formFieldLabel: {
                color: '#e2d9f3',
              },
              formFieldInput: {
                backgroundColor: '#140e24',
                borderColor: 'rgba(139, 92, 246, 0.2)',
                color: '#ffffff',
                borderRadius: '6px',
              },
              formButtonPrimary: {
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#ffffff',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '600',
              },
              footerActionLink: {
                color: '#8b5cf6',
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;