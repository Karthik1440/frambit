import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { fetchUserRole, syncCreatorProfile } from '../api';

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
  const [idToken, setIdToken] = useState(localStorage.getItem('firebase_id_token') || null);
  const [userRole, setUserRole] = useState('user'); // 'user' (client) or 'creator' (shooter)
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to restore session state from persistent storage or Firebase Auth & verify with backend
  const restoreUserSession = async (email) => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const storedProfile = getStoredUserProfile(cleanEmail) || {};
    const name = storedProfile.display_name || storedProfile.name || formatNameFromEmail(cleanEmail);
    const phone = storedProfile.phone || '';
    const initialRole = storedProfile.role || localStorage.getItem(`user_role_${cleanEmail}`) || 'user';
    const storedAvatar = localStorage.getItem('frambit_active_avatar') || storedProfile.avatar;

    setUserRole(initialRole);
    setUserData({
      ...storedProfile,
      name,
      display_name: name,
      email: cleanEmail,
      phone,
      role: initialRole,
      avatar: storedAvatar,
    });

    // Check with backend API to ensure creator role is accurately synced
    try {
      const backendRole = await fetchUserRole(cleanEmail);
      if (backendRole && (backendRole.is_creator || backendRole.role === 'creator')) {
        const creatorName = backendRole.display_name || backendRole.name || name;
        const creatorAvatar = backendRole.avatar || storedAvatar;
        setUserRole('creator');
        const updated = {
          ...storedProfile,
          id: backendRole.shooter_id || storedProfile.id,
          name: creatorName,
          display_name: creatorName,
          email: cleanEmail,
          phone: backendRole.phone || phone,
          role: 'creator',
          avatar: creatorAvatar,
          city: backendRole.city || storedProfile.city || 'Bengaluru',
          area: backendRole.area || storedProfile.area || '',
          bio: backendRole.bio || storedProfile.bio || '',
          category: backendRole.category || storedProfile.category || 'reel_shooter',
          hourly_price: backendRole.hourly_price || storedProfile.hourly_price || 799,
          packages: (Array.isArray(backendRole.packages) && backendRole.packages.length > 0) ? backendRole.packages : (storedProfile.packages || []),
          portfolio: (Array.isArray(backendRole.portfolio) && backendRole.portfolio.length > 0) ? backendRole.portfolio : (storedProfile.portfolio || []),
        };
        setUserData(updated);
        saveStoredUserProfile(cleanEmail, updated);
        localStorage.setItem(`user_role_${cleanEmail}`, 'creator');
        localStorage.setItem('active_user_session', JSON.stringify({ email: cleanEmail, role: 'creator' }));
      }
    } catch (e) {
      console.debug('Background role sync note:', e);
    }
  };

  // Firebase Auth State Listener with localStorage persistent session fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          setIdToken(token);
          localStorage.setItem('firebase_id_token', token);
        } catch (e) {
          console.debug('Failed to get Firebase token:', e);
        }
        restoreUserSession(user.email);
        localStorage.setItem('active_user_session', JSON.stringify({ email: user.email, role: userRole }));
      } else {
        setIdToken(null);
        localStorage.removeItem('firebase_id_token');
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
    const cleanEmail = (email || '').trim().toLowerCase();
    const profile = { name, email: cleanEmail, phone, role, avatar: null, packages: [], portfolio: [] };
    saveStoredUserProfile(cleanEmail, profile);
    if (cleanEmail) {
      localStorage.setItem(`user_role_${cleanEmail}`, role);
      localStorage.setItem('active_user_session', JSON.stringify({ email: cleanEmail, role }));
    }
    setUserRole(role);
    setUserData(profile);

    if (role === 'creator') {
      syncCreatorProfile({
        email: cleanEmail,
        display_name: name,
        phone,
        city: 'Bengaluru',
      }).catch(() => {});
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (res?.user) {
        await updateProfile(res.user, { displayName: name });
        setCurrentUser(res.user);
      }
      return { ...res, detectedRole: role };
    } catch (err) {
      console.warn("Firebase Signup Fallback (Demo Mode / Unconfigured):", err.message);
      // Fallback local state login for dev preview / unconfigured Firebase project
      const mockUser = { uid: cleanEmail, email: cleanEmail, displayName: name };
      setCurrentUser(mockUser);
      return { user: mockUser, detectedRole: role };
    }
  }

  // Sign in with Email and Password (Automatic Creator / User Role Detection & Session Persistence)
  async function login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Authenticate with Firebase
    let authRes = null;
    try {
      authRes = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (authRes?.user) {
        setCurrentUser(authRes.user);
        try {
          const token = await authRes.user.getIdToken();
          setIdToken(token);
          localStorage.setItem('firebase_id_token', token);
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Firebase Login Fallback (Demo Mode / Unconfigured):", err.message);
      const mockUser = { uid: cleanEmail, email: cleanEmail, displayName: formatNameFromEmail(cleanEmail) };
      setCurrentUser(mockUser);
      authRes = { user: mockUser };
    }

    // 2. Query Django backend to get definitive user role and creator details
    let backendRole = null;
    try {
      backendRole = await fetchUserRole(cleanEmail);
    } catch (e) {
      console.warn("fetchUserRole error:", e);
    }

    const storedProfile = getStoredUserProfile(cleanEmail);
    const storedRole = cleanEmail ? localStorage.getItem(`user_role_${cleanEmail}`) : null;
    
    const isCreatorFromBackend = Boolean(backendRole && (backendRole.is_creator || backendRole.role === 'creator'));
    const isCreatorFallback = Boolean(
      storedProfile?.role === 'creator' ||
      storedRole === 'creator'
    );

    const detectedRole = isCreatorFromBackend || isCreatorFallback ? 'creator' : (backendRole?.role || storedProfile?.role || storedRole || 'user');

    const name = backendRole?.display_name || backendRole?.name || storedProfile?.name || formatNameFromEmail(cleanEmail);
    const phone = backendRole?.phone || storedProfile?.phone || '';
    const avatar = backendRole?.avatar || storedProfile?.avatar || null;

    const profile = {
      ...storedProfile,
      ...(backendRole?.shooter_id ? { id: backendRole.shooter_id } : {}),
      name,
      display_name: name,
      email: cleanEmail,
      phone,
      role: detectedRole,
      avatar,
      city: backendRole?.city || storedProfile?.city || 'Bengaluru',
      area: backendRole?.area || storedProfile?.area || '',
      bio: backendRole?.bio || storedProfile?.bio || '',
      category: backendRole?.category || storedProfile?.category || 'reel_shooter',
      hourly_price: backendRole?.hourly_price || storedProfile?.hourly_price || 799,
      packages: (Array.isArray(backendRole?.packages) && backendRole.packages.length > 0) ? backendRole.packages : (storedProfile?.packages || []),
      portfolio: (Array.isArray(backendRole?.portfolio) && backendRole.portfolio.length > 0) ? backendRole.portfolio : (storedProfile?.portfolio || []),
    };

    saveStoredUserProfile(cleanEmail, profile);
    localStorage.setItem(`user_role_${cleanEmail}`, detectedRole);
    localStorage.setItem('active_user_session', JSON.stringify({ email: cleanEmail, role: detectedRole }));

    setUserRole(detectedRole);
    setUserData(profile);

    return { ...authRes, detectedRole, backendRole };
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
    localStorage.removeItem('firebase_id_token');
    setIdToken(null);
    setCurrentUser(null);
    setUserData(null);
  }

  const value = {
    currentUser,
    idToken,
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
