import React, { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../config/googleAuth';

interface GoogleAuthProviderProps {
  children: ReactNode;
}

const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  // Always provide Google OAuth context - if no client ID, it will show an error
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProvider; 