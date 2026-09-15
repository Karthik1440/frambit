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
export async function getOrCreateConversation(currentUser, targetPerson, booking = null) {
  const activeUser = currentUser || {};
  const target = targetPerson || {};

  const myId = activeUser.uid || activeUser.email || (activeUser.id ? String(activeUser.id) : 'user');
  const targetId = target.id || target.uid || target.email || 'creator';
  const chatId = getChatId(myId, targetId);

  const myName = activeUser.displayName || activeUser.name || (activeUser.email ? activeUser.email.split('@')[0] : 'User');
  const myAvatar = activeUser.photoURL || activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
  
  const targetName = target.display_name || target.name || 'Creator';
  const targetAvatar = target.avatar || target.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600';

  const clientAliases = [
    activeUser.uid,
    activeUser.email,
    activeUser.id ? String(activeUser.id) : null,
  ].filter(Boolean).map(String);

  const creatorAliases = [
    target.id ? String(target.id) : null,
    target.uid ? String(target.uid) : null,
    target.email ? String(target.email) : null,
    target.shooter_id ? String(target.shooter_id) : null,
    target.name ? target.name.toLowerCase().replace(/\s+/g, '_') : null,
    target.display_name ? target.display_name.toLowerCase().replace(/\s+/g, '_') : null,
  ].filter(Boolean).map(String);

  const participants = Array.from(new Set([...clientAliases, ...creatorAliases]));

  const chatMeta = {
    id: chatId,
    participants,
    client_id: String(myId),
    client_name: myName,
    client_avatar: myAvatar,
    client_email: activeUser.email || '',
    shooter_id: String(targetId),
    shooter_name: targetName,
    shooter_avatar: targetAvatar,
    shooter_email: target.email || '',
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
export async function sendChatMessage(chatId, { text, senderId, senderName, senderRole, images = [] }) {
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
    localChats[chatIdx] = {
      ...localChats[chatIdx],
      last_message: text.trim() || 'Sent an attachment',
      last_message_time: timeStr,
      timestamp,
      unread_count: nextUnread,
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
    await setDoc(chatDocRef, {
      last_message: text.trim() || 'Sent an attachment',
      last_message_time: timeStr,
      timestamp,
      unread_count: nextUnread,
      last_sender_id: String(senderId || 'guest'),
      updated_at: serverTimestamp(),
    }, { merge: true });
    console.log('✅ [ChatService] Chat metadata updated in Firestore');
  } catch (err) {
    console.error('❌ [ChatService] Firestore WRITE BLOCKED — sendChatMessage:', err.message);
    console.error('   → The message is ONLY in localStorage. Creator on another device cannot see it.');
    console.error('   → Fix: Firebase Console → Firestore → Rules.');
  }

  return messagePayload;
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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
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

  if (isCurrentShooter) {
    // Current user is the creator -> show client info
    return {
      name: chat.client_name || 'Client',
      avatar: chat.client_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'Client',
    };
  }

  // Current user is client -> show creator/shooter info
  return {
    name: chat.shooter_name || 'Creator',
    avatar: chat.shooter_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    role: 'Creator',
  };
}


