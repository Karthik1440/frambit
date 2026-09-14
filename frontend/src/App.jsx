import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import { AuthProvider, useAuth, saveStoredUserProfile } from './context/AuthContext';
import { CATEGORY_LABELS, fetchShooters, fetchShooterById, syncCreatorProfile, fetchBookings, createBooking, updateBookingStatusApi, deleteBooking, matchesBookingId, fetchReviewsApi } from './api';
import { FEATURED_TOP_CREATORS } from './data/featuredCreators';
import { detectCurrentCity } from './utils/location';

// Client Flow Views
import SplashView from './views/SplashView';
import RoleSelectionView from './views/RoleSelectionView';
import HomeView from './views/HomeView';
import SearchResultsView from './views/SearchResultsView';
import ShooterProfileView from './views/ShooterProfileView';
import BookSlotView from './views/BookSlotView';
import MyBookingsView from './views/MyBookingsView';
import PortfolioVideosView from './views/PortfolioVideosView';
import SavedCreatorsView from './views/SavedCreatorsView';
import RateExperienceView from './views/RateExperienceView';
import ClientProfileView from './views/ClientProfileView';
import ReceiveMediaView from './views/ReceiveMediaView';

// Chat & Booking Status Views (Screens #6, #7, #8)
import ChatListView from './views/ChatListView';
import ChatConversationView from './views/ChatConversationView';
import BookingStatusView from './views/BookingStatusView';
import { getOrCreateConversation, getChatId, subscribeToConversations } from './services/chatService';

// Auth View (Firebase Email, Password, Name, Phone Number, Role)
import AuthModalView from './views/AuthModalView';

// Creator Flow Views
import ShooterDashboardView from './views/ShooterDashboardView';
import EditProfileView from './views/EditProfileView';
import AvailabilityView from './views/AvailabilityView';
import BookingRequestsView from './views/BookingRequestsView';
import ReviewsRatingView from './views/ReviewsRatingView';
import ServicesPricingView from './views/ServicesPricingView';

// Blueprint Spec Canvas View (Full Diagram Showcase)
import BlueprintCanvasView from './views/BlueprintCanvasView';

function MainApp() {
  const { currentUser, userRole, userData, setUserData } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [postAuthRedirect, setPostAuthRedirect] = useState(null);
  const isLoggedIn = Boolean(
    currentUser ||
    (userData && userData.email && !['guest@frambit.com', 'Not signed in', ''].includes(userData.email))
  );

  const handleNavigate = (screen, catId) => {
    if (catId) setSelectedCategory(catId);
    if ((screen === 'chat_list' || screen === 'chat_conversation') && !isLoggedIn) {
      setPostAuthRedirect(screen);
      setCurrentScreen('auth_login');
      return;
    }
    setCurrentScreen(screen);
  };
  const [currentLocation, setCurrentLocation] = useState('Bengaluru');

  const handleUpdatePackages = (updatedPackages) => {
    if (userData && userData.email) {
      const newProfile = { ...userData, packages: updatedPackages };
      if (setUserData) setUserData(newProfile);
      saveStoredUserProfile(userData.email, newProfile);
      syncCreatorProfile(newProfile).catch(() => {});
    }
    setSelectedShooter((prev) => ({ ...prev, packages: updatedPackages }));
    setShooters((prev) =>
      prev.map((s) => (s.id === selectedShooter?.id || s.id === activeCreator?.id ? { ...s, packages: updatedPackages } : s))
    );
  };

  const handleUpdatePortfolio = (updatedPortfolio) => {
    setPortfolioVideos(updatedPortfolio);
    if (userData && userData.email) {
      const newProfile = { ...userData, portfolio: updatedPortfolio };
      if (setUserData) setUserData(newProfile);
      saveStoredUserProfile(userData.email, newProfile);
      syncCreatorProfile(newProfile).catch(() => {});
    }
    setSelectedShooter((prev) => ({ ...prev, portfolio: updatedPortfolio }));
    setShooters((prev) =>
      prev.map((s) => (s.id === selectedShooter?.id || s.id === activeCreator?.id ? { ...s, portfolio: updatedPortfolio } : s))
    );
  };

  // Purge any lingering old cached avatar URL / demo packages in localStorage on app load & fetch Django backend creators
  useEffect(() => {
    try {
      const demoKeys = ['aarav', 'priya', 'rohan', 'ananya', 'karthik_p', 'example.com'];
      ['frambit_shooters', 'frambit_active_creator_profile', 'frambit_active_avatar'].forEach((key) => {
        const item = localStorage.getItem(key);
        if (item && demoKeys.some((dk) => item.toLowerCase().includes(dk))) {
          localStorage.removeItem(key);
        } else if (item && (item.includes('unsplash.com') || item.includes('photo-1500648767791'))) {
          localStorage.setItem(key, item.replaceAll(/https:\/\/images\.unsplash\.com\/[^\s"']+/g, 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg'));
        }
      });
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('user_profile_') || key.startsWith('user_role_'))) {
          const item = localStorage.getItem(key);
          if (item && (item.includes('unsplash.com') || item.includes('photo-1500648767791'))) {
            localStorage.setItem(key, item.replaceAll(/https:\/\/images\.unsplash\.com\/[^\s"']+/g, 'https://ik.imagekit.io/reelshooter/profile_pictures/default_creator_avatar.jpg'));
          }
        }
      }
    } catch (e) {}

    // Fetch real Django backend creators from API (Source of Truth)
    fetchShooters().then((backendShooters) => {
      if (Array.isArray(backendShooters) && backendShooters.length > 0) {
        setShooters((prev) => {
          const map = new Map();
          backendShooters.forEach((s) => map.set(String(s.id), s));
          FEATURED_TOP_CREATORS.forEach((fc) => {
            if (!map.has(String(fc.id))) map.set(String(fc.id), fc);
          });
          return Array.from(map.values());
        });
        setSelectedShooter((current) => {
          if (!current) return backendShooters[0] || FEATURED_TOP_CREATORS[0];
          const matched = backendShooters.find((b) => b.id === current.id || (current.email && b.email === current.email));
          return matched || backendShooters[0] || FEATURED_TOP_CREATORS[0];
        });
      }
    });

    // Fetch real Django backend bookings from API (Source of Truth)
    fetchBookings().then((backendBookings) => {
      if (Array.isArray(backendBookings) && backendBookings.length > 0) {
        const formatted = backendBookings.map((b) => ({
          id: b.id.toString().startsWith('BK-') ? b.id : `BK-${b.id}`,
          rawId: b.id,
          service: b.notes || 'Reel Shoot',
          title: b.notes || 'Reel Shoot',
          amount: b.estimated_amount ? `₹${Number(b.estimated_amount).toLocaleString('en-IN')}` : '₹4,999',
          date: b.booking_date || 'Tomorrow',
          time: b.start_time ? b.start_time.slice(0, 5) : '10:00 AM',
          location: b.location || 'Bangalore',
          status: (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1).toLowerCase(),
          shooter_name: b.shooter_name || 'Creator',
          shooter_avatar: b.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg',
          image: b.shooter_avatar || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg',
          client_name: b.customer_name || 'Client',
          client_avatar: b.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          requested_at: b.created_at || 'Recently',
        }));
        setBookings((prev) => {
          let localCompletedMap = new Map();
          try {
            const stored = localStorage.getItem('frambit_bookings');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                parsed.forEach((p) => {
                  if ((p.status || '').toLowerCase() === 'completed') {
                    const clean = String(p.id).replace(/^BK-/, '');
                    localCompletedMap.set(clean, p);
                  }
                });
              }
            }
          } catch (e) {}

          const formattedWithLocal = formatted.map((f) => {
            const cleanId = String(f.id).replace(/^BK-/, '');
            const localSaved = localCompletedMap.get(cleanId);
            if (localSaved) {
              return { ...f, status: 'Completed', is_reviewed: localSaved.is_reviewed || false };
            }
            return f;
          });

          const existingIds = new Set(formattedWithLocal.map(x => String(x.id)));
          const filteredPrev = prev.filter(x => !existingIds.has(String(x.id)));
          return [...formattedWithLocal, ...filteredPrev];
        });
      }
    });
  }, []);
  const [shooters, setShooters] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_shooters');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only non-demo real user profiles
          const filtered = parsed.filter(s => s && s.email && !s.email.includes('example.com') && !s.email.includes('aarav') && !s.email.includes('priya') && !s.email.includes('rohan'));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {}
    return FEATURED_TOP_CREATORS;
  });
  const [selectedShooter, setSelectedShooter] = useState(shooters[0] || FEATURED_TOP_CREATORS[0]);
  const [selectedSlot, setSelectedSlot] = useState({ date: '20 Sep 2026', time: '4:00 PM - 6:00 PM' });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [bookings, setBookings] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  // Reviews state (persisted in localStorage and fetched from backend)
  const [reviews, setReviews] = useState(() => {
    try {
      const stored = localStorage.getItem('frambit_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Persist reviews to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('frambit_reviews', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  // Load reviews from backend API on mount
  useEffect(() => {
    fetchReviewsApi().then((apiReviews) => {
      if (Array.isArray(apiReviews) && apiReviews.length > 0) {
        setReviews((prev) => {
          const map = new Map();
          prev.forEach((r) => map.set(String(r.id), r));
          apiReviews.forEach((r) => {
            if (!map.has(String(r.id))) map.set(String(r.id), r);
          });
          return Array.from(map.values());
        });
      }
    });
  }, []);

  // Sync client reviews from bookings state if any exist
  useEffect(() => {
    if (Array.isArray(bookings)) {
      const bookingReviews = bookings
        .filter((b) => b && (b.client_review || b.review))
        .map((b) => {
          const cr = b.client_review || b.review;
          return {
            id: `rev-bk-${b.id}`,
            booking: b.id,
            shooter: b.shooter_id,
            shooter_id: b.shooter_id,
            customer_name: b.client_name || b.customer_name || 'Client',
            customer_avatar: b.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            rating: cr.rating || 5,
            comment: cr.comment || 'Great experience!',
            created_at: cr.created_at || b.date || 'Recent',
          };
        });
      if (bookingReviews.length > 0) {
        setReviews((prev) => {
          const map = new Map();
          prev.forEach((r) => map.set(String(r.id), r));
          bookingReviews.forEach((r) => {
            if (!map.has(String(r.id))) map.set(String(r.id), r);
          });
          return Array.from(map.values());
        });
      }
    }
  }, [bookings]);

  // Persist bookings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('frambit_bookings', JSON.stringify(bookings));
    } catch (e) {}
  }, [bookings]);

  // Persist shooters array to localStorage for client-side persistence
  useEffect(() => {
    try {
      localStorage.setItem('frambit_shooters', JSON.stringify(shooters));
    } catch (e) {}
  }, [shooters]);

  // Real-time unread chats badge counter across the whole app
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadChatCount(0);
      return;
    }
    const aliases = [
      currentUser?.uid,
      currentUser?.email,
      userData?.email,
      userData?.id ? String(userData.id) : null,
      userData?.name ? userData.name.toLowerCase().replace(/\s+/g, '_') : null,
      userData?.display_name ? userData.display_name.toLowerCase().replace(/\s+/g, '_') : null,
    ].filter(Boolean).map(String);

    if (aliases.length === 0) return;

    const unsubscribe = subscribeToConversations(aliases, (chats) => {
      const unread = (chats || []).filter((c) => (Number(c.unread_count) || 0) > 0).length;
      setUnreadChatCount(unread);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, userData, isLoggedIn]);

  // Creator View Scoping: Redirect creators away from user-only pages
  useEffect(() => {
    if (userRole === 'creator') {
      const creatorPages = [
        'dashboard',
        'shooter_profile',
        'services_pricing',
        'services',
        'packages',
        'booking_requests',
        'my_bookings',
        'portfolio',
        'profile_edit',
        'availability',
        'reviews_rating',
        'chat_list',
        'chat_conversation',
        'blueprint',
        'auth_signup',
        'auth_login'
      ];
      if (!creatorPages.includes(currentScreen)) {
        setCurrentScreen('dashboard');
      }
    }
  }, [userRole, currentScreen]);

  // Sync active creator profile data from userData to shooters state & selectedShooter unconditionally
  useEffect(() => {
    if (userData && (userData.name || userData.display_name)) {
      let cleanName = userData.display_name || userData.name;
      if (cleanName === 'Karthik P') cleanName = 'Karthik';

      const mergedFields = {
        name: cleanName,
        display_name: cleanName,
        email: userData.email,
        phone: userData.phone,
        avatar: userData.avatar,
        category: userData.category || 'reel_shooter',
        title: userData.title || 'Reel Shooter & Videographer',
        bio: userData.bio,
        city: userData.city,
        area: userData.area,
        hourly_price: userData.hourly_price,
        price_display: userData.price_display,
        equipment: userData.equipment,
        shooting_styles: userData.shooting_styles,
        experience: userData.experience,
        languages: userData.languages,
        availability_summary: userData.availability_summary,
        instagram_handle: userData.instagram_handle,
        services: userData.services,
        services_list: userData.services_list || userData.services,
        packages: userData.packages,
        portfolio: userData.portfolio,
      };

      setShooters((prev) =>
        prev.map((s) => {
          if (userData.email && s.email && s.email.toLowerCase() === userData.email.toLowerCase()) {
            const cleanMerged = {};
            Object.keys(mergedFields).forEach((key) => {
              if (mergedFields[key] !== undefined && mergedFields[key] !== null) {
                cleanMerged[key] = mergedFields[key];
              }
            });
            return { ...s, ...cleanMerged };
          }
          return s;
        })
      );

      setSelectedShooter((prev) => {
        if (prev && userData.email && prev.email && prev.email.toLowerCase() === userData.email.toLowerCase()) {
          const cleanMerged = {};
          Object.keys(mergedFields).forEach((key) => {
            if (mergedFields[key] !== undefined && mergedFields[key] !== null) {
              cleanMerged[key] = mergedFields[key];
            }
          });
          return { ...prev, ...cleanMerged };
        }
        return prev;
      });
    }
  }, [userData]);

  const handleSelectShooter = (shooter) => {
    setSelectedShooter(shooter);
    setCurrentScreen('shooter_profile');
    if (shooter && shooter.id) {
      fetchShooterById(shooter.id).then((fresh) => {
        if (fresh) {
          setSelectedShooter((prev) => ({ ...prev, ...fresh }));
          setShooters((prev) =>
            prev.map((s) => (s.id === fresh.id ? { ...s, ...fresh } : s))
          );
        }
      });
      fetchReviewsApi(shooter.id).then((freshReviews) => {
        if (Array.isArray(freshReviews) && freshReviews.length > 0) {
          setReviews((prev) => {
            const map = new Map();
            freshReviews.forEach((r) => map.set(String(r.id), r));
            prev.forEach((r) => {
              if (!map.has(String(r.id))) map.set(String(r.id), r);
            });
            return Array.from(map.values());
          });
        }
      });
    }
  };

  const handleStartBooking = (shooter, pkg = null) => {
    if (shooter) setSelectedShooter(shooter);
    setSelectedPackage(pkg);
    const isLoggedIn = Boolean(
      currentUser ||
      (userData && userData.email && !['guest@frambit.com', 'Not signed in'].includes(userData.email))
    );
    if (!isLoggedIn) {
      setPostAuthRedirect('book_slot');
      setCurrentScreen('auth_login');
      return;
    }
    setCurrentScreen('book_slot');
  };

  const handleConfirmSlot = (slotData) => {
    const isLoggedIn = Boolean(
      currentUser ||
      (userData && userData.email && !['guest@frambit.com', 'Not signed in'].includes(userData.email))
    );
    if (!isLoggedIn) {
      setPostAuthRedirect('book_slot');
      setCurrentScreen('auth_login');
      return;
    }
    setSelectedSlot(slotData);
    const packageTitle = slotData.package?.title || slotData.service || 'Reel Shoot';
    const packagePrice = slotData.amount || (slotData.package?.price ? `₹${Number(slotData.package.price).toLocaleString('en-IN')}` : (selectedShooter?.price_display || `₹${selectedShooter?.hourly_price || 799}`));
    const creatorImg = selectedShooter?.avatar || selectedShooter?.profile_image || 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg';
    
    const newBooking = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      title: packageTitle,
      service: packageTitle,
      package_id: slotData.package?.id || null,
      package_name: slotData.package?.title || null,
      shooter_id: selectedShooter?.id,
      shooter_name: selectedShooter?.display_name || selectedShooter?.name || 'Creator',
      shooter_avatar: creatorImg,
      image: creatorImg,
      client_name: userData?.display_name || userData?.name || 'Client',
      client_email: userData?.email || '',
      client_type: 'Client',
      date: slotData.date || '20 Sep 2026',
      time: slotData.time || '4:00 PM - 6:00 PM',
      location: slotData.location || `${currentLocation}, Karnataka`,
      requirements: slotData.requirements || '',
      status: 'Pending',
      amount: packagePrice,
      requested_at: 'Just now',
      accepted_at: null,
      declined_at: null,
    };
    setBookings((prev) => [newBooking, ...prev]);
    setSelectedBooking(newBooking);
    setCurrentScreen('booking_status');

    // Also persist booking to Django PostgreSQL backend API
    createBooking({
      shooter: selectedShooter?.id,
      client_name: userData?.display_name || userData?.name || 'Client',
      client_email: userData?.email || '',
      location: slotData.location || `${currentLocation}, Karnataka`,
      notes: packageTitle,
      estimated_amount: packagePrice.replace(/[^0-9.]/g, ''),
      booking_date: slotData.date || undefined,
      start_time: slotData.time || undefined,
    }).then((saved) => {
      if (saved && saved.id) {
        setBookings((prev) =>
          prev.map((b) => (b.id === newBooking.id ? { ...b, rawId: saved.id } : b))
        );
        setSelectedBooking((prev) =>
          prev && prev.id === newBooking.id ? { ...prev, rawId: saved.id } : prev
        );
      }
    });
  };

  const handleUpdateBookingStatus = (bookingId, newStatus, extraFields = {}) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBookings((prev) => {
      const updated = prev.map((b) => {
        if (matchesBookingId(b, bookingId)) {
          const isConfirmed = newStatus.toLowerCase() === 'confirmed' || newStatus.toLowerCase() === 'accepted';
          const isDeclined = newStatus.toLowerCase() === 'declined' || newStatus.toLowerCase() === 'cancelled' || newStatus.toLowerCase() === 'rejected';
          const isCompleted = newStatus.toLowerCase() === 'completed';
          return {
            ...b,
            status: newStatus,
            ...(isConfirmed ? { accepted_at: `Today, ${nowTime}` } : {}),
            ...(isDeclined ? { declined_at: `Today, ${nowTime}` } : {}),
            ...(isCompleted ? { completed_at: `Today, ${nowTime}` } : {}),
            ...extraFields,
          };
        }
        return b;
      });
      try {
        localStorage.setItem('frambit_bookings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setSelectedBooking((prev) => {
      if (prev && matchesBookingId(prev, bookingId)) {
        const isConfirmed = newStatus.toLowerCase() === 'confirmed' || newStatus.toLowerCase() === 'accepted';
        const isDeclined = newStatus.toLowerCase() === 'declined' || newStatus.toLowerCase() === 'cancelled' || newStatus.toLowerCase() === 'rejected';
        const isCompleted = newStatus.toLowerCase() === 'completed';
        return {
          ...prev,
          status: newStatus,
          ...(isConfirmed ? { accepted_at: `Today, ${nowTime}` } : {}),
          ...(isDeclined ? { declined_at: `Today, ${nowTime}` } : {}),
          ...(isCompleted ? { completed_at: `Today, ${nowTime}` } : {}),
          ...extraFields,
        };
      }
      return prev;
    });

    // Also persist status transition to backend Django API
    const targetBooking = bookings.find((b) => matchesBookingId(b, bookingId));
    const dbId = targetBooking?.rawId || (typeof bookingId === 'string' && bookingId.startsWith('BK-') ? bookingId.replace('BK-', '') : bookingId);
    if (dbId && !isNaN(Number(dbId))) {
      updateBookingStatusApi(dbId, newStatus);
    }
  };

  const handleDeleteBooking = (bookingId) => {
    const targetBooking = bookings.find((b) => matchesBookingId(b, bookingId));
    const dbId = targetBooking?.rawId || (typeof bookingId === 'string' && bookingId.startsWith('BK-') ? bookingId.replace('BK-', '') : bookingId);
    if (dbId && !isNaN(Number(dbId))) {
      deleteBooking(dbId).catch(() => {});
    }
    setBookings((prev) => prev.filter((b) => !matchesBookingId(b, bookingId)));
    try {
      const stored = localStorage.getItem('frambit_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((b) => !matchesBookingId(b, bookingId));
          localStorage.setItem('frambit_bookings', JSON.stringify(filtered));
        }
      }
    } catch (e) {}
  };

  const handleClearAllBookings = () => {
    bookings.forEach((b) => {
      const dbId = b.rawId || (typeof b.id === 'string' && b.id.startsWith('BK-') ? b.id.replace('BK-', '') : b.id);
      if (dbId && !isNaN(Number(dbId))) {
        deleteBooking(dbId).catch(() => {});
      }
    });
    setBookings([]);
    try {
      localStorage.setItem('frambit_bookings', JSON.stringify([]));
    } catch (e) {}
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setCurrentScreen('chat_conversation');
  };

  const handleStartChat = (targetPerson, booking = null) => {
    if (!isLoggedIn) {
      if (targetPerson) setSelectedShooter(targetPerson);
      setPostAuthRedirect(targetPerson ? 'shooter_profile' : 'chat_list');
      setCurrentScreen('auth_login');
      return;
    }

    const activeUser = currentUser || userData || {};
    const myId = activeUser?.uid || activeUser?.email || (userData?.id ? String(userData.id) : 'user');
    const target = targetPerson || {};
    const targetId = target.id || target.uid || target.email || 'creator';
    const chatId = getChatId(myId, targetId);

    const clientAliases = [
      activeUser.uid,
      activeUser.email,
      userData?.email,
      activeUser.id ? String(activeUser.id) : null,
      userData?.id ? String(userData.id) : null,
    ].filter(Boolean).map(String);

    const creatorAliases = [
      target.id ? String(target.id) : null,
      target.uid ? String(target.uid) : null,
      target.email ? String(target.email) : null,
      target.shooter_id ? String(target.shooter_id) : null,
      target.name ? target.name.toLowerCase().replace(/\s+/g, '_') : null,
      target.display_name ? target.display_name.toLowerCase().replace(/\s+/g, '_') : null,
    ].filter(Boolean).map(String);

    const initialChat = {
      id: chatId,
      participants: Array.from(new Set([...clientAliases, ...creatorAliases])),
      client_id: String(myId),
      client_name: activeUser?.displayName || userData?.name || 'Client',
      client_avatar: activeUser?.photoURL || userData?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      client_email: activeUser.email || userData?.email || '',
      shooter_id: String(targetId),
      shooter_name: target.display_name || target.name || 'Creator',
      shooter_avatar: target.avatar || target.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      shooter_email: target.email || '',
      last_message: 'Chat started',
      last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      unread_count: 0,
      booking_id: booking ? (booking.id || booking.rawId) : null,
      booking_title: booking ? (booking.title || booking.service || 'Reel Shoot') : null,
      booking_date: booking ? (booking.date || 'Upcoming') : null,
    };

    // 1. Instant zero-latency screen switch
    setSelectedChat(initialChat);
    setCurrentScreen('chat_conversation');
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {}

    // 2. Background sync with Firestore & local cache
    getOrCreateConversation(activeUser, target, booking)
      .then((chat) => {
        if (chat) setSelectedChat(chat);
      })
      .catch((err) => {
        console.warn('Background getOrCreateConversation note:', err);
      });
  };

  const handleSelectBooking = (b) => {
    setSelectedBooking(b);
    setCurrentScreen('booking_status');
  };

  const activeCreator = useMemo(() => {
    let name = userData?.display_name || userData?.name || 'Creator';
    if (name === 'Karthik P') name = 'Karthik';
    let avatar = userData?.avatar || localStorage.getItem('frambit_active_avatar');
    if (!avatar || avatar.includes('photo-1500648767791')) {
      avatar = 'https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg';
    }
    const cover_image = avatar;
    const hourly_price = userData?.hourly_price !== undefined ? Number(userData.hourly_price) : 799;
    const price_display = userData?.price_display || `₹${Number(hourly_price).toLocaleString('en-IN')}/hr`;
    const category = userData?.category || 'reel_shooter';
    const title = userData?.title || name;

    // Real active creator's packages and portfolio belong to them ONLY (empty by default for new creators)
    const packages = userData?.packages || [];
    const portfolio = userData?.portfolio || [];

    return {
      id: userData?.id || 999,
      name,
      display_name: name,
      email: userData?.email || '',
      phone: userData?.phone || '',
      role: userData?.role || 'creator',
      avatar,
      cover_image,
      hourly_price,
      price_display,
      category,
      title,
      packages,
      portfolio,
      bio: userData?.bio || '',
      city: userData?.city || 'Bengaluru',
      area: userData?.area || '',
      equipment: userData?.equipment || '',
      shooting_styles: userData?.shooting_styles || [],
    };
  }, [userData]);

  const syncedShooters = useMemo(() => {
    // Only creators (role='creator' or 'shooter') appear as cards — clients never show
    const isCreator = userRole === 'creator' && userData && (
      userData.role === 'creator' ||
      userData.role === 'shooter'
    );
    if ((!shooters || shooters.length === 0) && isCreator) {
      return [activeCreator];
    }
    if (!shooters || shooters.length === 0) {
      return [];
    }
    return shooters.map((s) => {
      // ONLY merge active creator if logged in as creator and emails match
      if (isCreator && userData?.email && s.email && s.email.toLowerCase() === userData.email.toLowerCase()) {
        return {
          ...s,
          ...userData,
          display_name: userData.display_name || userData.name || s.display_name,
          name: userData.display_name || userData.name || s.name || s.display_name,
          packages: Array.isArray(userData.packages) && userData.packages.length > 0 ? userData.packages : (s.packages || []),
          portfolio: Array.isArray(userData.portfolio) && userData.portfolio.length > 0 ? userData.portfolio : (s.portfolio || [])
        };
      }
      return s;
    });
  }, [shooters, userData, activeCreator, userRole]);

  const currentShooterForView = useMemo(() => {
    if (userRole === 'creator') {
      if (!selectedShooter || (userData?.email && selectedShooter.email && selectedShooter.email.toLowerCase() === userData.email.toLowerCase())) {
        return {
          ...selectedShooter,
          ...activeCreator,
        };
      }
    }
    return selectedShooter || syncedShooters[0] || null;
  }, [selectedShooter, activeCreator, userData, userRole, syncedShooters]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative pb-16 sm:pb-0">
      
      {/* Top Navbar */}
      {currentScreen !== 'splash' && currentScreen !== 'auth_signup' && currentScreen !== 'auth_login' && currentScreen !== 'creator_login' && userRole !== 'creator' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={(screenId) => setCurrentScreen(screenId)}
          currentLocation={currentLocation}
          onLocationChange={(newLoc) => setCurrentLocation(newLoc)}
          unreadChatCount={unreadChatCount}
        />
      )}

      {/* Main Fluid Responsive Screen Container */}
      <main className="flex-1 w-full">

        {/* 1. Splash View */}
        {currentScreen === 'splash' && (
          <div className="max-w-md mx-auto my-6 sm:rounded-3xl overflow-hidden shadow-2xl">
            <SplashView onNavigate={(screen) => setCurrentScreen(screen)} />
          </div>
        )}

        {/* Firebase Authentication Sign Up View */}
        {currentScreen === 'auth_signup' && (
          <AuthModalView
            initialMode="signup"
            onNavigate={(screen) => {
              if (postAuthRedirect) {
                const target = postAuthRedirect;
                setPostAuthRedirect(null);
                setCurrentScreen(target);
              } else {
                setCurrentScreen(screen);
              }
            }}
          />
        )}

        {/* Firebase Authentication Sign In View */}
        {currentScreen === 'auth_login' && (
          <AuthModalView
            initialMode="login"
            onNavigate={(screen) => {
              if (postAuthRedirect) {
                const target = postAuthRedirect;
                setPostAuthRedirect(null);
                setCurrentScreen(target);
              } else {
                setCurrentScreen(screen);
              }
            }}
          />
        )}

        {/* 2. Role Selection View */}
        {currentScreen === 'role_selection' && (
          <RoleSelectionView
            onSelectRole={(role) => setUserRole(role)}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Home View (Default Landing Page) */}
        {currentScreen === 'home' && (
          <HomeView
            shooters={syncedShooters}
            onNavigate={handleNavigate}
            onSelectShooter={handleSelectShooter}
            currentLocation={currentLocation}
          />
        )}

        {/* Saved Creators View */}
        {currentScreen === 'saved' && (
          <SavedCreatorsView
            shooters={syncedShooters}
            onNavigate={handleNavigate}
            onSelectShooter={handleSelectShooter}
          />
        )}

        {/* Search Results View */}
        {currentScreen === 'search' && (
          <SearchResultsView
            shooters={syncedShooters}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onNavigate={handleNavigate}
            onSelectShooter={handleSelectShooter}
            currentLocation={currentLocation}
          />
        )}

        {/* 4. User Flow Step 2: Creator Profile (👤 CREATOR PROFILE) */}
        {currentScreen === 'shooter_profile' && (
          <ShooterProfileView
            shooter={currentShooterForView}
            reviews={reviews}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onStartBooking={handleStartBooking}
            onStartChat={(creator) => handleStartChat(creator || currentShooterForView)}
          />
        )}

        {/* 5. User Flow Step 3: Request Booking (📅 REQUEST BOOKING) */}
        {currentScreen === 'book_slot' && (
          <BookSlotView
            shooter={currentShooterForView}
            selectedPackage={selectedPackage}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onConfirmSlot={handleConfirmSlot}
          />
        )}

        {/* 6. User Flow Step 4: Chat (💬 CHAT) & Chat List */}
        {currentScreen === 'chat_list' && (
          <ChatListView
            onNavigate={(screen) => setCurrentScreen(screen)}
            onSelectChat={handleSelectChat}
          />
        )}

        {currentScreen === 'chat_conversation' && (
          <ChatConversationView
            chat={selectedChat}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenBookingDetails={() => setCurrentScreen('booking_status')}
          />
        )}

        {/* 7. User Flow Step 5: Booking Confirmed (🤝 BOOKING DETAILS & TIMELINE) */}
        {currentScreen === 'booking_status' && (
          <BookingStatusView
            booking={selectedBooking}
            userRole={userRole}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenChat={() => {
              const target = {
                id: selectedBooking?.shooter_id || selectedBooking?.shooterId || selectedShooter?.id || 1,
                name: selectedBooking?.shooter_name || selectedShooter?.name || 'Creator',
                avatar: selectedBooking?.shooter_avatar || selectedShooter?.avatar
              };
              handleStartChat(target, selectedBooking);
            }}
            onUpdateStatus={handleUpdateBookingStatus}
          />
        )}

        {/* My Bookings View */}
        {currentScreen === 'my_bookings' && (
          <MyBookingsView
            bookings={bookings}
            userRole={userRole}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onSelectBooking={handleSelectBooking}
            onUpdateStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            onClearBookings={handleClearAllBookings}
            onStartChat={handleStartChat}
          />
        )}

        {/* Profile / Menu View */}
        {currentScreen === 'client_profile' && (
          <ClientProfileView
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Creator Flow Section 1: Creator Dashboard */}
        {currentScreen === 'dashboard' && (
          <ShooterDashboardView
            shooter={activeCreator}
            bookings={bookings}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onUpdatePackages={handleUpdatePackages}
            onUpdatePortfolio={handleUpdatePortfolio}
            onUpdateStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            onClearBookings={handleClearAllBookings}
            unreadChatCount={unreadChatCount}
          />
        )}

        {/* Creator Flow Section 2: Booking Requests (Accept/Decline -> Chat) */}
        {currentScreen === 'booking_requests' && (
          <BookingRequestsView
            initialBookings={bookings}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onUpdateStatus={handleUpdateBookingStatus}
            onStartChat={handleStartChat}
          />
        )}

        {/* Portfolio View (Works for both Creator managing their portfolio, and Client viewing creator's portfolio) */}
        {currentScreen === 'portfolio' && (
          <PortfolioVideosView
            key={`portfolio-${currentShooterForView?.id || 'active'}-${(currentShooterForView?.portfolio || []).length}`}
            videos={currentShooterForView?.portfolio || []}
            shooter={currentShooterForView}
            isReadOnly={userRole !== 'creator'}
            onUpdateVideos={handleUpdatePortfolio}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Creator Flow Section 4: Edit Profile */}
        {currentScreen === 'profile_edit' && (
          <EditProfileView
            shooter={activeCreator}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onUpdatePackages={handleUpdatePackages}
            onUpdateShooter={(updatedShooter) => {
              const targetId = updatedShooter.id || 1;
              const cleanShooter = { ...updatedShooter, id: targetId };
              setSelectedShooter(cleanShooter);
              setShooters((prev) =>
                prev.map((s, idx) =>
                  (s.id === targetId || idx === 0 || (cleanShooter.email && s.email === cleanShooter.email))
                    ? { ...s, ...cleanShooter }
                    : s
                )
              );
            }}
          />
        )}

        {/* Creator Flow Section 5: Services & Packages Management */}
        {(currentScreen === 'services_pricing' || currentScreen === 'services' || currentScreen === 'packages') && (
          <ServicesPricingView
            key={`packages-${activeCreator?.id}-${activeCreator?.packages?.length || 0}`}
            shooter={activeCreator}
            onUpdatePackages={handleUpdatePackages}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Creator Login View */}
        {currentScreen === 'creator_login' && (
          <AuthModalView
            initialMode="login"
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Reviews & Rating View */}
        {(currentScreen === 'reviews_rating' || currentScreen === 'review_rating') && (
          <ReviewsRatingView
            reviews={reviews}
            shooter={activeCreator || selectedShooter}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Receive Media View */}
        {currentScreen === 'receive_media' && (
          <ReceiveMediaView
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Rate Experience View */}
        {currentScreen === 'rate_experience' && (
          <RateExperienceView
            shooter={
              selectedBooking
                ? {
                    id: selectedBooking.shooter_id,
                    display_name: selectedBooking.shooter_name,
                    name: selectedBooking.shooter_name,
                    avatar: selectedBooking.shooter_avatar,
                    service: selectedBooking.service || selectedBooking.title,
                  }
                : selectedShooter
            }
            booking={selectedBooking}
            userRole={userRole}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onSubmitReview={(bookingId, reviewData) => {
              const targetShooterId = reviewData.shooter || reviewData.shooter_id || selectedBooking?.shooter_id || selectedShooter?.id;
              const newReviewItem = {
                id: `rev-${Date.now()}`,
                booking: bookingId,
                shooter: targetShooterId,
                shooter_id: targetShooterId,
                customer_name: reviewData.customer_name || userData?.display_name || userData?.name || 'Karthik',
                customer_avatar: reviewData.customer_avatar || userData?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                rating: Number(reviewData.rating) || 5,
                comment: reviewData.comment || 'Great shoot experience and professional reel delivery!',
                created_at: new Date().toISOString(),
              };

              // Immediately prepend to reviews state
              setReviews((prev) => [newReviewItem, ...prev.filter((r) => r.id !== newReviewItem.id)]);

              // Update booking status with is_reviewed and reviewData
              if (bookingId) {
                handleUpdateBookingStatus(bookingId, 'Completed', {
                  is_reviewed: true,
                  client_review: reviewData,
                });
              }

              // Update matching shooter's rating and review_count in real-time
              if (targetShooterId) {
                setShooters((prev) =>
                  prev.map((s) => {
                    if (String(s.id) === String(targetShooterId)) {
                      const curCount = Number(s.review_count || 0);
                      const curRating = Number(s.rating || 5.0);
                      const newCount = curCount + 1;
                      const newRating = Number(((curRating * curCount + Number(reviewData.rating || 5)) / newCount).toFixed(1));
                      return { ...s, rating: newRating, review_count: newCount };
                    }
                    return s;
                  })
                );

                setSelectedShooter((prev) => {
                  if (!prev || (String(prev.id) !== String(targetShooterId))) return prev;
                  const curCount = Number(prev.review_count || 0);
                  const curRating = Number(prev.rating || 5.0);
                  const newCount = curCount + 1;
                  const newRating = Number(((curRating * curCount + Number(reviewData.rating || 5)) / newCount).toFixed(1));
                  return { ...prev, rating: newRating, review_count: newCount };
                });
              }
            }}
          />
        )}

        {/* Availability Schedule View */}
        {currentScreen === 'availability' && (
          <AvailabilityView
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {/* Blueprint View */}
        {currentScreen === 'blueprint' && (
          <BlueprintCanvasView
            onNavigate={(screen) => setCurrentScreen(screen)}
            onSelectShooter={handleSelectShooter}
          />
        )}

      </main>

      {/* Best Premium Dark Footer */}
      {currentScreen !== 'splash' && currentScreen !== 'chat_conversation' && currentScreen !== 'auth_signup' && currentScreen !== 'auth_login' && currentScreen !== 'creator_login' && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* Global Responsive Bottom Navigation Bar */}
      {currentScreen !== 'splash' && currentScreen !== 'blueprint' && currentScreen !== 'auth_signup' && currentScreen !== 'auth_login' && currentScreen !== 'creator_login' && (
        <BottomNav
          activeTab={currentScreen}
          onTabChange={(screenId) => setCurrentScreen(screenId)}
          unreadChatCount={unreadChatCount}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}


