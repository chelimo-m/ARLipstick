require("@testing-library/jest-dom");

// Mock Next.js router
jest.mock("next/router", () => ({
	useRouter() {
		return {
			route: "/",
			pathname: "/",
			query: {},
			asPath: "/",
			push: jest.fn(),
			pop: jest.fn(),
			reload: jest.fn(),
			back: jest.fn(),
			prefetch: jest.fn().mockResolvedValue(undefined),
			beforePopState: jest.fn(),
			events: {
				on: jest.fn(),
				off: jest.fn(),
				emit: jest.fn(),
			},
			isFallback: false,
		};
	},
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			refresh: jest.fn(),
		};
	},
	useSearchParams() {
		return new URLSearchParams();
	},
	usePathname() {
		return "/";
	},
}));

// Mock Firebase
jest.mock("firebase/app", () => ({
	initializeApp: jest.fn(),
	getApps: jest.fn(() => []),
}));

jest.mock("firebase/auth", () => ({
	getAuth: jest.fn(() => ({
		currentUser: null,
		onAuthStateChanged: jest.fn(),
		signInWithPopup: jest.fn(),
		signOut: jest.fn(),
	})),
	GoogleAuthProvider: jest.fn(),
	signInWithPopup: jest.fn(),
	signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
	getFirestore: jest.fn(),
	collection: jest.fn(),
	doc: jest.fn(),
	getDoc: jest.fn(),
	getDocs: jest.fn(),
	addDoc: jest.fn(),
	updateDoc: jest.fn(),
	deleteDoc: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	orderBy: jest.fn(),
	limit: jest.fn(),
}));

// Mock MediaPipe
jest.mock("@mediapipe/tasks-vision", () => ({
	FaceLandmarker: jest.fn(),
	FilesetResolver: jest.fn(),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(() => "mocked-url");
global.URL.revokeObjectURL = jest.fn();
