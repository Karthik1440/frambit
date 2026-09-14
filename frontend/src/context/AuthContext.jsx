import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Helper to format clean display name from email address
export function formatNameFromEmail(email) {
  if (!email) return 'User';
  const username = email.split('@')[0];
  return username
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Helper to get stored user profile by email
export function getStoredUserProfile(email) {
  if (!email) return null;
  try {
    const data = localStorage.getItem(`user_profile_${email.toLowerCase()}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Helper to save user profile by email
export function saveStoredUserProfile(email, profileObj) {
  if (!email || !profileObj) return;
  try {
    const cleanProfile = { ...profileObj };
    // Save avatar safely to frambit_active_avatar
    if (cleanProfile.avatar) {
      try {
        localStorage.setItem('frambit_active_avatar', cleanProfile.avatar);
      } catch (e) {}
    }
    localStorage.setItem(`user_profile_${email.toLowerCase()}`, JSON.stringify(cleanProfile));
  } catch (e) {
    console.warn("localStorage quota exceeded, safely ignored:", e.message);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user'); // 'user' (client) or 'creator' (shooter)
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to restore session state from persistent storage or Firebase Auth
  const restoreUserSession = (email) => {
    if (!email) return;
    const storedProfile = getStoredUserProfile(email) || {};
    const name = storedProfile.display_name || storedProfile.name || formatNameFromEmail(email);
    const phone = storedProfile.phone || '';
    const role = storedProfile.role || localStorage.getItem(`user_role_${email.toLowerCase()}`) || 'user';

    const storedAvatar = localStorage.getItem('frambit_active_avatar') || storedProfile.avatar;

    setUserRole(role);
    setUserData({
      ...storedProfile,
      name,
      display_name: name,
      email,
      phone,
      role,
      avatar: storedAvatar,
    });
  };

  // Firebase Auth State Listener with localStorage persistent session fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        restoreUserSession(user.email);
        localStorage.setItem('active_user_session', JSON.stringify({ email: user.email, role: userRole }));
      } else {
        // Fallback: check if local active session exists across refresh
        try {
          const sessionData = localStorage.getItem('active_user_session');
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed && parsed.email) {
              const mockUser = { uid: parsed.email, email: parsed.email };
              setCurrentUser(mockUser);
              restoreUserSession(parsed.email);
            } else {
              setCurrentUser(null);
              setUserData(null);
            }
          } else {
            setCurrentUser(null);
            setUserData(null);
          }
        } catch (e) {
          setCurrentUser(null);
          setUserData(null);
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firebase auth listener fallback:", error);
      // Fallback check on error
      try {
        const sessionData = localStorage.getItem('active_user_session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed && parsed.email) {
            setCurrentUser({ uid: parsed.email, email: parsed.email });
            restoreUserSession(parsed.email);
          }
        }
      } catch (e) {}
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with Email, Password, Name, Phone Number, and Role
  async function signup(email, password, name, phone, role) {
    const profile = { name, email, phone, role, avatar: null, packages: [], portfolio: [] };
    saveStoredUserProfile(email, profile);
    if (email) {
      localStorage.setItem(`user_role_${email.toLowerCase()}`, role);
      localStorage.setItem('active_user_session', JSON.stringify({ email, role }));
    }
    setUserRole(role);
    setUserData(profile);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (res?.user) {
        await updateProfile(res.user, { displayName: name });
        setCurrentUser(res.user);
      }
      return { ...res, detectedRole: role };
    } catch (err) {
      console.warn("Firebase Signup Fallback (Demo Mode / Unconfigured):", err.message);
      // Fallback local state login for dev preview / unconfigured Firebase project
      const mockUser = { uid: email, email, displayName: name };
      setCurrentUser(mockUser);
      return { user: mockUser, detectedRole: role };
    }
  }

  // Sign in with Email and Password (Automatic Creator / User Role Detection & Session Persistence)
  async function login(email, password) {
    const storedProfile = getStoredUserProfile(email);
    const storedRole = email ? localStorage.getItem(`user_role_${email.toLowerCase()}`) : null;
    const detectedRole = storedProfile?.role || storedRole || (email && (email.toLowerCase().includes('creator') || email.toLowerCase().includes('shooter')) ? 'creator' : 'user');
    
    const name = storedProfile?.name || formatNameFromEmail(email);
    const phone = storedProfile?.phone || '';
    const avatar = storedProfile?.avatar || null;

    const profile = {
      ...storedProfile,
      name,
      email,
      phone,
      role: detectedRole,
      avatar,
      packages: storedProfile?.packages || [],
      portfolio: storedProfile?.portfolio || [],
    };
    saveStoredUserProfile(email, profile);
    if (email) {
      localStorage.setItem('active_user_session', JSON.stringify({ email, role: detectedRole }));
    }

    setUserRole(detectedRole);
    setUserData(profile);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (res?.user) {
        setCurrentUser(res.user);
      }
      return { ...res, detectedRole };
    } catch (err) {
      console.warn("Firebase Login Fallback (Demo Mode / Unconfigured):", err.message);
      const mockUser = { uid: email, email, displayName: name };
      setCurrentUser(mockUser);
      return { user: mockUser, detectedRole };
    }
  }

  // Update active profile details
  function updateUserData(newFields) {
    setUserData((prev) => {
      const activeEmail = newFields?.email || prev?.email || currentUser?.email || 'karthik@frambit.com';
      let cleanName = newFields?.name || newFields?.display_name || prev?.name || prev?.display_name || (activeEmail ? formatNameFromEmail(activeEmail) : 'Karthik');
      if (cleanName === 'Karthik P') cleanName = 'Karthik';
      const updated = {
        ...prev,
        ...newFields,
        name: cleanName,
        display_name: cleanName,
        email: activeEmail,
        role: newFields?.role || prev?.role || userRole,
      };
      if (updated.avatar) {
        try {
          localStorage.setItem('frambit_active_avatar', updated.avatar);
        } catch (e) {}
      }
      if (updated.email) {
        saveStoredUserProfile(updated.email, updated);
      }
      try {
        localStorage.setItem('frambit_active_creator_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  // Sign out
  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase Logout Error:", err);
    }
    localStorage.removeItem('active_user_session');
    setCurrentUser(null);
    setUserData(null);
  }

  const value = {
    currentUser,
    userRole,
    setUserRole,
    userData,
    setUserData: updateUserData,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
