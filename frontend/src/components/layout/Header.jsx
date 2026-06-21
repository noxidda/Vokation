import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import './Header.css';

const Header = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="header">
      <div className="header__left">
        <span className="header__title">MergeMetrics</span>
      </div>
      <div className="header__right">
        {user && (
          <>
            <span className="header__user">
              {user.firstName} {user.lastName}
            </span>
            <button 
              className="header__btn" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;