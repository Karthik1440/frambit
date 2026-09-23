import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

/**
 * Checks if Firebase has an active auth session without forcing an unconfigured anonymous signup.
 */
export async function ensureFirebaseAuth() {
  if (auth?.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(auth?.currentUser || null), 800);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(u || null);
    });
  });
}

// Helper to generate a consistent chat ID between two participants
export function getChatId(id1, id2) {
  const clean1 = String(id1 || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  const clean2 = String(id2 || 'creator').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sorted = [clean1, clean2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

// Local storage fallback helpers for resilience
const LOCAL_CHATS_KEY = 'frambit_local_chats';
const LOCAL_MSGS_PREFIX = 'frambit_local_msgs_';

export function getLocalChats() {
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveLocalChats(chats) {
  try {
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
    window.dispatchEvent(new CustomEvent('frambit_chat_updated'));
  } catch (e) {}
}

export function getLocalMessages(chatId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_MSGS_PREFIX}${chatId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveLocalMessages(chatId, messages) {
  try {
    localStorage.setItem(`${LOCAL_MSGS_PREFIX}${chatId}`, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('frambit_msg_updated', { detail: { chatId } }));
  } catch (e) {}
}

/**
 * Creates or retrieves a chat conversation between the current user and a creator/client.
 */
export async function getOrCreateConversation(currentUser, targetPerson, booking = null, userRole = null) {
  const activeUser = currentUser || {};
  const target = targetPerson || {};

  const isInitiatorCreator = userRole === 'creator' || userRole === 'shooter' || activeUser.role === 'shooter';

  const clientObj = isInitiatorCreator ? target : activeUser;
  const creatorObj = isInitiatorCreator ? activeUser : target;

  const clientId = clientObj.uid || clientObj.email || (clientObj.id ? String(clientObj.id) : 'client');
  const shooterId = creatorObj.id ? String(creatorObj.id) : (creatorObj.shooter_id ? String(creatorObj.shooter_id) : (creatorObj.uid || creatorObj.email || 'creator'));

  const chatId = getChatId(clientId, shooterId);

  const clientName = clientObj.displayName || clientObj.display_name || clientObj.name || (clientObj.email ? clientObj.email.split('@')[0] : 'Client');
  let clientAvatar = clientObj.photoURL || clientObj.avatar || clientObj.profile_image || null;

  const shooterName = creatorObj.display_name || creatorObj.name || 'Creator';
  let shooterAvatar = creatorObj.avatar || creatorObj.profile_image || null;

  const clientAliases = [
    clientObj.uid,
    clientObj.email,
    clientObj.client_email,
    clientObj.id ? String(clientObj.id) : null,
    clientObj.name ? clientObj.name.toLowerCase().replace(/\s+/g, '_') : null,
    clientObj.display_name ? clientObj.display_name.toLowerCase().replace(/\s+/g, '_') : null,
  ].filter(Boolean).map((s) => String(s).toLowerCase().trim());

  const creatorAliases = [
    creatorObj.id ? String(creatorObj.id) : null,
    creatorObj.uid ? String(creatorObj.uid) : null,
    creatorObj.email ? String(creatorObj.email) : null,
    creatorObj.shooter_email ? String(creatorObj.shooter_email) : null,
    creatorObj.shooter_id ? String(creatorObj.shooter_id) : null,
    creatorObj.name ? creatorObj.name.toLowerCase().replace(/\s+/g, '_') : null,
    creatorObj.display_name ? creatorObj.display_name.toLowerCase().replace(/\s+/g, '_') : null,
  ].filter(Boolean).map((s) => String(s).toLowerCase().trim());

  const participants = Array.from(new Set([...clientAliases, ...creatorAliases]));

  const chatMeta = {
    id: chatId,
    participants,
    client_id: String(clientId),
    client_name: clientName,
    client_avatar: clientAvatar,
    client_email: clientObj.email || clientObj.client_email || '',
    shooter_id: String(shooterId),
    shooter_name: shooterName,
    shooter_avatar: shooterAvatar,
    shooter_email: creatorObj.email || creatorObj.shooter_email || '',
    last_message: 'Chat started',
    last_message_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    unread_count: 0,
    booking_id: booking ? (booking.id || booking.rawId) : null,
    booking_title: booking ? (booking.title || booking.service || 'Reel Shoot') : null,
    booking_date: booking ? (booking.date || 'Upcoming') : null,
  };

  // 1. Immediately save to local cache for instant reactive rendering
  const localList = getLocalChats();
  const idx = localList.findIndex((c) => c.id === chatId);
  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...chatMeta };
  } else {
    localList.unshift(chatMeta);
  }
  saveLocalChats(localList);

  // 2. Sync to Firestore in background (no timeout — let Firebase handle retries)
  try {
    await ensureFirebaseAuth();
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, {
      ...chatMeta,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }, { merge: true });
    console.log('✅ [ChatService] Chat doc written to Firestore:', chatId, '| shooter_email:', chatMeta.shooter_email);
  } catch (err) {
    console.error('❌ [ChatService] Firestore WRITE BLOCKED — getOrCreateConversation:', err.message);
    console.error('   → Check Firebase Console → Firestore → Rules.');
  }

  return chatMeta;
}

/**
 * Subscribes to real-time chat conversations list strictly for the logged-in user.
 */
export function subscribeToConversations(userAliasesOrId, onUpdate) {
  const aliasList = Array.isArray(userAliasesOrId)
    ? userAliasesOrId.map((a) => String(a).toLowerCase().trim()).filter(Boolean)
    : (userAliasesOrId ? [String(userAliasesOrId).toLowerCase().trim()] : []);

  // Only logged-in users who have aliases can subscribe to their conversations
  if (aliasList.length === 0) {
    onUpdate([]);
    return () => {};
  }

  const filterChat = (chat) => {
    if (!chat) return false;
    const parts = Array.isArray(chat.participants)
      ? chat.participants.map((p) => String(p).toLowerCase().trim())
      : [];

    // Normalise all chat identity fields for comparison
    const chatClientId     = String(chat.client_id     || '').toLowerCase().trim();
    const chatClientEmail  = String(chat.client_email  || '').toLowerCase().trim();
    const chatShooterId    = String(chat.shooter_id    || '').toLowerCase().trim();
    const chatShooterEmail = String(chat.shooter_email || '').toLowerCase().trim();

    return aliasList.some((alias) => {
      const a = String(alias).toLowerCase().trim();
      return (
        // 1. Check the participants array
        parts.includes(a) ||
        // 2. Direct field matches (email is the most reliable cross-system key)
        (chatClientEmail  && chatClientEmail  === a) ||
        (chatShooterEmail && chatShooterEmail === a) ||
        (chatClientId     && chatClientId     === a) ||
        (chatShooterId    && chatShooterId    === a)
      );
    });
  };

  // Initial load strictly matching the current user
  const initialChats = getLocalChats().filter(filterChat);
  onUpdate(initialChats);

  let unsubscribeFirestore = null;

  try {
    const chatsRef = collection(db, 'chats');
    unsubscribeFirestore = onSnapshot(
      chatsRef,
      (snapshot) => {
        const firestoreChats = [];
        snapshot.forEach((docSnap) => {
          firestoreChats.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (firestoreChats.length > 0) {
          const localChats = getLocalChats();
          const map = new Map();
          localChats.forEach((c) => map.set(c.id, c));
          firestoreChats.forEach((c) => {
            if (!map.has(c.id) || (c.timestamp || 0) >= (map.get(c.id)?.timestamp || 0)) {
              map.set(c.id, c);
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          saveLocalChats(merged);
          onUpdate(merged.filter(filterChat));
        } else {
          onUpdate(getLocalChats().filter(filterChat));
        }
      },
      (err) => {
        console.warn('Firestore chats onSnapshot error, using local fallback:', err.message);
        onUpdate(getLocalChats().filter(filterChat));
      }
    );
  } catch (e) {
    console.warn('Failed to attach Firestore chats listener:', e.message);
  }

  // Cross-tab custom event listener
  const handleLocalUpdate = () => {
    onUpdate(getLocalChats().filter(filterChat));
  };
  window.addEventListener('frambit_chat_updated', handleLocalUpdate);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    window.removeEventListener('frambit_chat_updated', handleLocalUpdate);
  };
}

/**
 * Subscribes to real-time messages within a specific chat conversation.
 */
export function subscribeToMessages(chatId, onUpdate) {
  if (!chatId) return () => {};

  // Initial local load
  const cachedMessages = getLocalMessages(chatId);
  onUpdate(cachedMessages);

  let unsubscribeFirestore = null;

  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('created_at_ms', 'asc'));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => {
          msgs.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (msgs.length > 0) {
          saveLocalMessages(chatId, msgs);
          onUpdate(msgs);
        } else if (cachedMessages.length > 0) {
          onUpdate(cachedMessages);
        }
      },
      (err) => {
        console.warn('Firestore messages onSnapshot error, using local fallback:', err.message);
        onUpdate(getLocalMessages(chatId));
      }
    );
  } catch (e) {
    console.warn('Failed to attach Firestore messages listener:', e.message);
  }

  // Cross-tab / local event listener
  const handleLocalMsg = (e) => {
    if (!e.detail || e.detail.chatId === chatId) {
      onUpdate(getLocalMessages(chatId));
    }
  };
  window.addEventListener('frambit_msg_updated', handleLocalMsg);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    window.removeEventListener('frambit_msg_updated', handleLocalMsg);
  };
}

/**
 * Sends a message in a conversation.
 */
export async function sendChatMessage(chatId, { text, senderId, senderName, senderRole, senderAvatar = null, images = [] }) {
  if (!chatId || (!text?.trim() && images.length === 0)) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timestamp = Date.now();

  const messagePayload = {
    id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
    text: text.trim(),
    sender_id: String(senderId || 'guest'),
    sender_name: senderName || 'User',
    sender_role: senderRole || 'client',
    images: images || [],
    time: timeStr,
    created_at_ms: timestamp,
    read: false,
  };

  // 1. Instantly update local messages cache for responsive UI
  const localMsgs = getLocalMessages(chatId);
  localMsgs.push(messagePayload);
  saveLocalMessages(chatId, localMsgs);

  // 2. Update local chat metadata
  const localChats = getLocalChats();
  const chatIdx = localChats.findIndex((c) => c.id === chatId);
  const nextUnread = (localChats[chatIdx]?.unread_count || 0) + 1;
  if (chatIdx >= 0) {
    const isClientSender = senderRole === 'client' || senderRole === 'user';
    localChats[chatIdx] = {
      ...localChats[chatIdx],
      last_message: text.trim() || 'Sent an attachment',
      last_message_time: timeStr,
      timestamp,
      unread_count: nextUnread,
      ...(senderAvatar && isClientSender ? { client_avatar: senderAvatar } : {}),
      ...(senderAvatar && !isClientSender ? { shooter_avatar: senderAvatar } : {}),
    };
    saveLocalChats(localChats);
  }

  // 3. Persist to Firebase Firestore with setDoc merge
  try {
    await ensureFirebaseAuth();
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const msgRef = await addDoc(messagesRef, {
      ...messagePayload,
      server_timestamp: serverTimestamp(),
    });
    console.log('✅ [ChatService] Message written to Firestore:', msgRef.id, '| chatId:', chatId);

    const chatDocRef = doc(db, 'chats', chatId);
    const chatUpdates = {
      last_message: text.trim() || 'Sent an attachment',
      last_message_time: timeStr,
      timestamp,
      unread_count: nextUnread,
      last_sender_id: String(senderId || 'guest'),
      updated_at: serverTimestamp(),
    };
    if (senderAvatar) {
      if (senderRole === 'client' || senderRole === 'user') {
        chatUpdates.client_avatar = senderAvatar;
      } else {
        chatUpdates.shooter_avatar = senderAvatar;
      }
    }
    await setDoc(chatDocRef, chatUpdates, { merge: true });
    console.log('✅ [ChatService] Chat metadata updated in Firestore');
  } catch (err) {
    console.error('❌ [ChatService] Firestore WRITE BLOCKED — sendChatMessage:', err.message);
    console.error('   → The message is ONLY in localStorage. Creator on another device cannot see it.');
    console.error('   → Fix: Firebase Console → Firestore → Rules.');
  }

  return messagePayload;
}

/**
 * Real-time sync: Updates user avatar across all active chat conversations in Firestore & local cache.
 * When a client or creator changes their profile picture, this propagates to all their chats in real time,
 * triggering onSnapshot on the other participant's device instantly.
 */
export async function syncUserAvatarToChats(emailOrUid, newAvatar, role = 'client', displayName = null) {
  if (!emailOrUid) return;
  const cleanId = String(emailOrUid).toLowerCase().trim();
  const avatarUrl = (newAvatar && typeof newAvatar === 'string') ? newAvatar.trim() : null;

  // 1. Update local cache immediately
  const localList = getLocalChats();
  let localChanged = false;
  localList.forEach((chat) => {
    const isClient = (chat.client_email && chat.client_email.toLowerCase().trim() === cleanId) ||
                     (chat.client_id && String(chat.client_id).toLowerCase().trim() === cleanId);
    const isShooter = (chat.shooter_email && chat.shooter_email.toLowerCase().trim() === cleanId) ||
                      (chat.shooter_id && String(chat.shooter_id).toLowerCase().trim() === cleanId);

    if (isClient) {
      chat.client_avatar = avatarUrl;
      if (displayName) chat.client_name = displayName;
      localChanged = true;
    }
    if (isShooter) {
      chat.shooter_avatar = avatarUrl;
      if (displayName) chat.shooter_name = displayName;
      localChanged = true;
    }
  });
  if (localChanged) {
    saveLocalChats(localList);
  }

  // 2. Query and update all matching Firestore chat documents
  try {
    await ensureFirebaseAuth();
    const chatsRef = collection(db, 'chats');
    const updatePromises = [];

    // Query client chats
    try {
      const q1 = query(chatsRef, where('client_email', '==', cleanId));
      const snap1 = await getDocs(q1);
      snap1.forEach((docSnap) => {
        const updateData = { client_avatar: avatarUrl, updated_at: serverTimestamp() };
        if (displayName) updateData.client_name = displayName;
        updatePromises.push(setDoc(doc(db, 'chats', docSnap.id), updateData, { merge: true }));
      });
    } catch (e) {}

    // Query shooter chats
    try {
      const q2 = query(chatsRef, where('shooter_email', '==', cleanId));
      const snap2 = await getDocs(q2);
      snap2.forEach((docSnap) => {
        const updateData = { shooter_avatar: avatarUrl, updated_at: serverTimestamp() };
        if (displayName) updateData.shooter_name = displayName;
        updatePromises.push(setDoc(doc(db, 'chats', docSnap.id), updateData, { merge: true }));
      });
    } catch (e) {}

    // Fallback: scan all chats if specific queries had 0 matches
    if (updatePromises.length === 0) {
      try {
        const allSnap = await getDocs(chatsRef);
        allSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const isCl = (data.client_email && data.client_email.toLowerCase().trim() === cleanId) ||
                       (data.client_id && String(data.client_id).toLowerCase().trim() === cleanId);
          const isSh = (data.shooter_email && data.shooter_email.toLowerCase().trim() === cleanId) ||
                       (data.shooter_id && String(data.shooter_id).toLowerCase().trim() === cleanId);
          if (isCl) {
            const upd = { client_avatar: avatarUrl, updated_at: serverTimestamp() };
            if (displayName) upd.client_name = displayName;
            updatePromises.push(setDoc(doc(db, 'chats', docSnap.id), upd, { merge: true }));
          } else if (isSh) {
            const upd = { shooter_avatar: avatarUrl, updated_at: serverTimestamp() };
            if (displayName) upd.shooter_name = displayName;
            updatePromises.push(setDoc(doc(db, 'chats', docSnap.id), upd, { merge: true }));
          }
        });
      } catch (e) {}
    }

    await Promise.all(updatePromises);
    console.log(`✅ [ChatService] Propagated avatar update to ${updatePromises.length} chats in Firestore`);
  } catch (err) {
    console.warn('Sync avatar to Firestore chats note:', err.message);
  }
}

/**
 * Resets the unread count of a chat to 0 when opened.
 */
export async function markChatAsRead(chatId) {
  if (!chatId) return;

  // 1. Immediately reset in local cache
  const localChats = getLocalChats();
  const chatIdx = localChats.findIndex((c) => c.id === chatId);
  if (chatIdx >= 0 && localChats[chatIdx].unread_count > 0) {
    localChats[chatIdx] = {
      ...localChats[chatIdx],
      unread_count: 0,
    };
    saveLocalChats(localChats);
  }

  // 2. Persist 0 to Firestore
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, { unread_count: 0 }, { merge: true });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Clears all messages within a conversation.
 */
export async function clearChatMessages(chatId) {
  if (!chatId) return;

  // 1. Instantly clear local message cache
  saveLocalMessages(chatId, []);

  // 2. Update local chat list metadata
  const localChats = getLocalChats();
  const chatIdx = localChats.findIndex((c) => c.id === chatId);
  if (chatIdx >= 0) {
    localChats[chatIdx] = {
      ...localChats[chatIdx],
      last_message: 'Chat cleared',
      unread_count: 0,
    };
    saveLocalChats(localChats);
  }

  // 3. Clear messages in Firestore
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const snap = await getDocs(messagesRef);
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, 'chats', chatId, 'messages', docSnap.id)));
    });
    await Promise.all(deletePromises);

    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, {
      last_message: 'Chat cleared',
      unread_count: 0,
      updated_at: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[ChatService] clearChatMessages Firestore note:', err.message);
  }
}

/**
 * Deletes an entire conversation and its messages.
 */
export async function deleteConversation(chatId) {
  if (!chatId) return;

  // 1. Remove local messages and chat
  saveLocalMessages(chatId, []);
  const localChats = getLocalChats().filter((c) => c.id !== chatId);
  saveLocalChats(localChats);

  // 2. Delete from Firestore
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const snap = await getDocs(messagesRef);
    const deletePromises = [];
    snap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, 'chats', chatId, 'messages', docSnap.id)));
    });
    await Promise.all(deletePromises);

    await deleteDoc(doc(db, 'chats', chatId));
  } catch (err) {
    console.warn('[ChatService] deleteConversation Firestore note:', err.message);
  }
}

/**
 * Resolves the other participant in a conversation relative to the currently logged-in user.
 */
export function getChatPartner(chat, currentUser, userData, userRole) {
  if (!chat) {
    return {
      name: 'Creator',
      avatar: null,
      role: 'Creator',
    };
  }

  const myEmail = (currentUser?.email || userData?.email || '').toLowerCase().trim();
  const myUid = (currentUser?.uid || '').toLowerCase().trim();
  const myId = (userData?.id ? String(userData.id) : '').toLowerCase().trim();
  const myName = (currentUser?.displayName || userData?.display_name || userData?.name || '').toLowerCase().trim();

  const shooterEmail = (chat.shooter_email || '').toLowerCase().trim();
  const shooterId = (chat.shooter_id || '').toLowerCase().trim();
  const shooterName = (chat.shooter_name || '').toLowerCase().trim();

  const clientEmail = (chat.client_email || '').toLowerCase().trim();
  const clientId = (chat.client_id || '').toLowerCase().trim();
  const clientName = (chat.client_name || '').toLowerCase().trim();

  // Check direct matches for shooter
  const matchesShooter = Boolean(
    (myEmail && (shooterEmail === myEmail || shooterId === myEmail)) ||
    (myUid && shooterId === myUid) ||
    (myId && (shooterId === myId || shooterId === `creator_${myId}`)) ||
    (myName && shooterName && shooterName === myName)
  );

  // Check direct matches for client
  const matchesClient = Boolean(
    (myEmail && (clientEmail === myEmail || clientId === myEmail)) ||
    (myUid && clientId === myUid) ||
    (myId && clientId === myId) ||
    (myName && clientName && clientName === myName)
  );

  // Determine whether current user is the shooter or client in this chat
  let isCurrentShooter = false;
  if (matchesShooter && !matchesClient) {
    isCurrentShooter = true;
  } else if (matchesClient && !matchesShooter) {
    isCurrentShooter = false;
  } else if (userRole === 'creator' || userRole === 'shooter') {
    isCurrentShooter = true;
  } else {
    isCurrentShooter = false;
  }

  const sanitizeAvatar = (av) => {
    if (!av || typeof av !== 'string') return null;
    const clean = av.trim();
    if (!clean || clean === 'null' || clean === 'undefined' || clean.includes('photo-1500648767791')) return null;
    return clean;
  };

  if (isCurrentShooter) {
    // Current user is the creator -> show client info
    const rawClientAv = chat.client_avatar || chat.customer_avatar || chat.clientAvatar;
    let finalClientAv = sanitizeAvatar(rawClientAv);

    // If missing from chat document, check cached user profile by client email
    if (!finalClientAv && chat.client_email) {
      try {
        const stored = localStorage.getItem(`user_profile_${chat.client_email.toLowerCase().trim()}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.avatar) finalClientAv = sanitizeAvatar(parsed.avatar);
        }
      } catch (e) {}
    }

    const clientRawName = chat.client_name || chat.customer_name;
    const clientCleanName = (clientRawName && clientRawName.length >= 20 && !clientRawName.includes(' ') && !clientRawName.includes('@'))
      ? (chat.client_email ? chat.client_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Client')
      : (clientRawName || (chat.client_email ? chat.client_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Client'));

    return {
      name: clientCleanName || 'Client',
      email: chat.client_email || '',
      avatar: finalClientAv,
      role: 'Client',
    };
  }

  // Current user is client -> show creator/shooter info
  const rawShooterAv = chat.shooter_avatar || chat.shooterAvatar;
  let finalShooterAv = sanitizeAvatar(rawShooterAv);
  return {
    name: chat.shooter_name || 'Creator',
    email: chat.shooter_email || '',
    avatar: finalShooterAv,
    role: 'Creator',
  };
}


