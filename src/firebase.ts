import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Configure Google Provider for smooth Gmail login
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

// If any anonymous session lingers from previous attempts, clean it up
onAuthStateChanged(auth, (user) => {
  if (user && user.isAnonymous) {
    signOut(auth).catch(() => {});
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per skill instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
    }
  }
}
testConnection();

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
}

// Authentication helpers
export async function loginWithGoogle(): Promise<LoginResult> {
  try {
    // If an anonymous session exists, clear it first so Google credential does not conflict
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      await signOut(auth);
    }

    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Sync user profile to Firestore in background without blocking or failing auth
      const userRef = doc(db, 'users', result.user.uid);
      setDoc(
        userRef,
        {
          userId: result.user.uid,
          displayName: result.user.displayName || 'Bé Yêu',
          photoURL: result.user.photoURL || '',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Could not sync user profile to Firestore:', err);
      });

      return { success: true, user: result.user };
    }
    return { success: false, error: 'Không nhận được thông tin tài khoản Google.' };
  } catch (error: any) {
    console.error('Login error:', error);
    const code = error?.code || '';
    let friendlyMessage = 'Đăng nhập không thành công. Vui lòng thử lại!';

    if (code === 'auth/popup-blocked') {
      friendlyMessage = 'Trình duyệt đang chặn cửa sổ popup. Vui lòng cho phép popup để tiếp tục đăng nhập Google.';
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Cửa sổ đăng nhập bị đóng trước khi hoàn tất.';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Yêu cầu đăng nhập trước đó đã bị hủy. Hãy bấm thử lại nhé!';
    } else if (code === 'auth/network-request-failed') {
      friendlyMessage = 'Lỗi kết nối mạng khi liên hệ Google. Vui lòng kiểm tra Wifi/4G!';
    } else if (code === 'auth/unauthorized-domain') {
      friendlyMessage = 'Tên miền chưa được cấp phép trong cấu hình Firebase Auth.';
    } else if (code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Phương thức đăng nhập Google chưa được kích hoạt.';
    } else if (error?.message) {
      friendlyMessage = `Lỗi: ${error.message}`;
    }

    return { success: false, error: friendlyMessage, errorCode: code };
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Save completion score
export async function savePuzzleCompletionScore(data: {
  puzzleId: string;
  pieceCount: number;
  completionTime: number;
  stars: number;
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;
  const path = `users/${auth.currentUser.uid}/scores`;
  try {
    const scoresCol = collection(db, path);
    await addDoc(scoresCol, {
      id: `score-${Date.now()}`,
      puzzleId: data.puzzleId,
      userId: auth.currentUser.uid,
      pieceCount: data.pieceCount,
      completionTime: data.completionTime,
      stars: data.stars,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Save custom puzzle
export async function saveCustomPuzzleToFirebase(puzzle: {
  id: string;
  title: string;
  src: string;
  category: string;
  pieceCount: number;
}): Promise<void> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;
  const path = `puzzles/${puzzle.id}`;
  try {
    await setDoc(doc(db, 'puzzles', puzzle.id), {
      ...puzzle,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Load cloud puzzles
export async function loadCloudPuzzles(): Promise<any[]> {
  const path = 'puzzles';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.warn('Could not load cloud puzzles:', err);
    return [];
  }
}

// Delete custom puzzle from Firestore
export async function deleteCustomPuzzleFromFirebase(puzzleId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `puzzles/${puzzleId}`;
  try {
    await deleteDoc(doc(db, 'puzzles', puzzleId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

