import * as admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin() {
	if (!firebaseApp) {
		try {
			// Check if Firebase app is already initialized
			const existingApps = admin.apps;
			if (existingApps.length > 0) {
				firebaseApp = existingApps[0];
				console.log("Using existing Firebase Admin app");
			} else {
				console.log("Initializing Firebase Admin...");

				// Firebase Admin configuration for arlipstick-84040 project
				const serviceAccount = {
					projectId:
						process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "arlipstick-84040",
					clientEmail:
						process.env.FIREBASE_CLIENT_EMAIL ||
						"firebase-adminsdk-fbsvc@arlipstick-84040.iam.gserviceaccount.com",
					privateKey:
						process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ||
						"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCqeMpgW96sJ7+R\n3Ax7xD87k0VhEmm4Huhu+lEUcUlWkxfhP0dGsj3oQ5/XjU3D8+Unht1BnnAQuplI\n7DiFz0sArSOiuuHhM78qYy4RtWQanjj9kl/jA/+DeH7qmCCfdWv/ZftU4cK0PjSz\nWenLYa5vah1vr5VlWdciu48bLx413OUQVKRNRBFbz6bqT7WarWkn3WIvJgrkILGS\nzU2La9rCrqQRMqIY92GfTMVwdjbBlLnysFTiMmGiNEr2M0haTJUJIRzVEDZAag0g\nFXMhXjdmM25QJpcaBj8LPpK4AmJdrp85FQpvXbiuSMvnusacKPN4uIXPR3xZd3u6\nv2lFU5hfAgMBAAECggEAUyetzHgz8/VFsOBOpJbzo1tw5eul7z8AcZYgM+EY/aat\n6N3Fpnou0ZwfHfXbH8FaoD/csPQYxUhImnZEEh2uf+t1LR2NLp3f28zafZ/mb0eM\nFEExDdt26co+2q+Phkkwf7pe8aZYpDSN34j2DxQck1OHfWIAdZpv44zrPz7qNSo5\n9oq+0vhz1rcUn+3k4s0HD6izgKwBsbM56ekU64nGKqh5Q5p80vyBPKzVi4D0nSSw\nZGJKelkePDXYvrWn1BPTGOM1AFIQ4tKsQwCgIv6tRUTwBpy7kW+tbWUL8L66/Ayq\nuFgGM3px+F9Oves7L77qRYzJp6NMR9fpaIlniEj+GQKBgQDbHsipImhJqOS7yv8a\nzcD6l5lkuTCYTmubB7zu4ohJnWxMIxQoDT2ukIxUXtbQVj7eb8SRqqHBpqynaJBw\nfvaprYAw6gyb7CDZfXF8qpMzr6p4TsTsmKJCqfp+ylUqubMykUJmjwcP7nehPoEF\njnyHCtvEJLvVjgwoL+Jn7AlUiQKBgQDHKeWHxKG1XAhjhEpElw4jXz09/UOOvB8w\nBfDhT7YrLHgY1d6BoB7u7Vee6EIH/lh95Qk7kQANz+DSsfoHWYO9M+pCNfOIi2x6\n0OQSn2888BLwPD3LFIR2gfE6x8QU/wfRh+CeFzIB7CqfLYxOeQnU1AS21gx4k3Nb\nMcLWxfsbpwKBgGBTNg70KzhGYNcVM/QKg00mG66lonEx+CfczPeO6i7CX3tQ6Gl6\n+KSmsqncTz6iy1xpcdY/VoCUzs2BMA3kIncQ6IuYOBbLRN2XQa52JePQ03Wz2unP\nZ3U61/2o4Ku5msceCDyhn48nW7usiHdy3ddXtKiTJWeJ3FpGQpdAshFRAoGARjx4\nPdESVisGqlHU/ytmSQMlTd8rHAMr3Hu73zmFPOSJ1fhWZ9BYGFqLM/ckkj0YaA2F\nnAQeyMAuwR8S1dSzqN3OF1t/bv/8WbOhOxAO4qanhyE3iY7KyCA7OkeI1v65eyM4\nC4iSkir/PPOLL4Fv/iZnIzOJYlxdqiN6WtOnIrECgYBBIVibCkKsXIfS8T8aGqRM\ngfKchhMsKV+XW5c/9en4V1bwu1ognFfwfqPr8+7FfmlQktcJqWQch34WVRFsewI3\nwzz28WiGQ1G8yIZ8lK4DhrcgZFLANiVNDD7VXrcEXd2vl5l4EgiOpZwfuvLRxBrb\nbT0knxhtyAPb2cilsYOm1Q==\n-----END PRIVATE KEY-----\n",
				};

				// Validate required environment variables
				if (
					!serviceAccount.projectId ||
					!serviceAccount.clientEmail ||
					!serviceAccount.privateKey
				) {
					throw new Error(
						"Missing required Firebase Admin environment variables. Please update your .env.local file with new Firebase credentials."
					);
				}

				firebaseApp = admin.initializeApp({
					credential: admin.credential.cert(
						serviceAccount as admin.ServiceAccount
					),
				});
				console.log("Firebase Admin initialized successfully");
			}
		} catch (error) {
			console.error("Failed to initialize Firebase Admin:", error);
			throw error;
		}
	}
	return firebaseApp;
}

export { admin };
