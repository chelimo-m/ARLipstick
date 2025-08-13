"use client";
import { useEffect, useState } from "react";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithCustomToken,
} from "firebase/auth";
import { app } from "../../firebaseConfig";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserAvatar from "../../components/UserAvatar";
import VerificationCodeInput from "../../components/VerificationCodeInput";

type UserType = {
	uid: string;
	email: string;
	displayName: string;
	photoURL: string | null;
};

type LoginMethod = "google" | "code";
type AuthMode = "login" | "register";

export default function LoginPage() {
	const [user, setUser] = useState<UserType | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [loginMethod, setLoginMethod] = useState<LoginMethod>("code");
	const [authMode, setAuthMode] = useState<AuthMode>("login");
	const [email, setEmail] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [code, setCode] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [codeLoading, setCodeLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [userId, setUserId] = useState("");
	const [isAnimating, setIsAnimating] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const auth = getAuth(app);
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				const idToken = await firebaseUser.getIdToken();
				const res = await fetch("/api/auth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ idToken }),
				});
				const data = await res.json();
				setUser(data.user);
				console.log("User object (onAuthStateChanged):", data.user);
				router.replace("/dashboard");
			}
		});
		return () => unsubscribe();
	}, [router]);

	const handleGoogleLogin = async () => {
		setLoading(true);
		setError("");
		try {
			const auth = getAuth(app);
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const idToken = await result.user.getIdToken();
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ idToken }),
			});
			const data = await res.json();
			if (res.ok) {
				setUser(data.user);
				console.log("User object (login):", data.user);
				router.replace("/dashboard");
			} else {
				setError(data.message || "Login failed");
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	};

	const handleSendCode = async (isResend = false) => {
		if (!email) {
			setError("Please enter your email address");
			return;
		}

		if (authMode === "register" && !displayName && !isResend) {
			setError("Please enter your display name");
			return;
		}

		if (isResend) {
			setResendLoading(true);
		} else {
			setCodeLoading(true);
		}
		setError("");

		try {
			const endpoint =
				authMode === "login" ? "/api/auth/login-code" : "/api/auth/register";
			const body =
				authMode === "login"
					? { email, resend: isResend }
					: {
							email,
							displayName,
							resend: isResend,
							userId: isResend ? userId : undefined,
					  };

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json();

			if (res.ok) {
				if (!isResend) {
					setCodeSent(true);
					if (authMode === "register") {
						setUserId(data.userId);
					}
				}
				setError("");
				if (data.code) {
					console.log(
						`${authMode === "login" ? "Login" : "Registration"} code:`,
						data.code
					);
				}

				// Start cooldown timer for resend
				if (isResend) {
					setResendCooldown(60);
					const timer = setInterval(() => {
						setResendCooldown((prev) => {
							if (prev <= 1) {
								clearInterval(timer);
								return 0;
							}
							return prev - 1;
						});
					}, 1000);
				}
			} else {
				setError(
					data.message ||
						`Failed to send ${
							authMode === "login" ? "login" : "registration"
						} code`
				);
			}
		} catch (err) {
			setError(
				`Failed to send ${
					authMode === "login" ? "login" : "registration"
				} code. Please try again.`
			);
		} finally {
			if (isResend) {
				setResendLoading(false);
			} else {
				setCodeLoading(false);
			}
		}
	};

	const handleVerifyCode = async () => {
		if (!code) {
			setError("Please enter the verification code");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const endpoint =
				authMode === "login"
					? "/api/auth/verify-code"
					: "/api/auth/verify-registration";
			const body = authMode === "login" ? { email, code } : { userId, code };

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json();

			if (res.ok) {
				const auth = getAuth(app);
				await signInWithCustomToken(auth, data.customToken);

				setUser(data.user);
				console.log("User object (code auth):", data.user);
				router.replace("/dashboard");
			} else {
				setError(data.message || "Invalid code");
			}
		} catch (err) {
			setError("Failed to verify code. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const resetCodeForm = () => {
		setCodeSent(false);
		setCode("");
		setError("");
		setUserId("");
		setResendCooldown(0);
		setResendLoading(false);
	};

	const switchAuthMode = () => {
		setIsAnimating(true);
		setTimeout(() => {
			setAuthMode(authMode === "login" ? "register" : "login");
			setCodeSent(false);
			setCode("");
			setError("");
			setEmail("");
			setDisplayName("");
			setUserId("");
			setResendCooldown(0);
			setResendLoading(false);
			setIsAnimating(false);
		}, 300);
	};

	const switchLoginMethod = () => {
		setIsAnimating(true);
		setTimeout(() => {
			setLoginMethod(loginMethod === "google" ? "code" : "google");
			setCodeSent(false);
			setCode("");
			setError("");
			setResendCooldown(0);
			setResendLoading(false);
			setIsAnimating(false);
		}, 300);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4 sm:p-6 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
				<div className="absolute top-40 left-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
			</div>

			<div className="relative w-full max-w-md">
				{/* Main Card */}
				<div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
					{/* Shimmer effect */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>

					{/* Logo and Header */}
					<div className="text-center mb-8 relative z-10">
						<div className="relative inline-block mb-6">
							<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
							<Image
								src="/ar-lipstick-logo.svg"
								alt="Joanna K Cosmetics"
								width={80}
								height={80}
								className="relative w-20 h-20 drop-shadow-lg"
								priority
							/>
						</div>
						<h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
							Joanna K Cosmetics
						</h1>
						<p className="text-gray-600 font-medium">
							Premium Cosmetics & Virtual Try-On
						</p>
						<p className="text-gray-500 text-sm mt-1">
							{authMode === "login"
								? "Welcome back! Sign in to continue"
								: "Join us! Create your account"}
						</p>
					</div>

					{/* User Info or Login Options */}
					{user ? (
						<div className="text-center">
							<div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
								<div className="relative mx-auto w-20 h-20 mb-4">
									<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
									<UserAvatar
										photoURL={user.photoURL}
										displayName={user.displayName}
										email={user.email}
										size={80}
										className="relative w-full h-full border-4 border-white shadow-lg"
									/>
								</div>
								<h3 className="text-lg font-semibold text-gray-800 mb-1">
									Welcome back, {user.displayName}!
								</h3>
								<p className="text-gray-600 text-sm mb-4">{user.email}</p>
								<div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
									<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
									<span>Redirecting to dashboard...</span>
								</div>
							</div>
						</div>
					) : (
						<div
							className={`space-y-6 transition-all duration-300 ${
								isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
							}`}
						>
							{/* Google Sign-In/Sign-Up */}
							{loginMethod === "google" && (
								<button
									onClick={handleGoogleLogin}
									className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 hover:border-pink-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
									disabled={loading}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative flex items-center justify-center gap-3">
										<svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 48 48">
											<g>
												<path
													fill="#4285F4"
													d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"
												/>
												<path
													fill="#34A853"
													d="M6.3 14.7l6.6 4.8C14.3 16.1 18.7 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3c-7.1 0-13.1 4.1-16.1 10.1z"
												/>
												<path
													fill="#FBBC05"
													d="M24 43c5.6 0 10.3-1.8 13.7-4.9l-6.3-5.2C29.6 36 27 37 24 37c-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C7.9 39.1 15.3 43 24 43z"
												/>
												<path
													fill="#EA4335"
													d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"
												/>
											</g>
										</svg>
										<span className="font-bold">
											{loading
												? `${
														authMode === "login" ? "Signing in" : "Signing up"
												  }...`
												: `${
														authMode === "login" ? "Sign in" : "Sign up"
												  } with Google`}
										</span>
									</div>
								</button>
							)}

							{/* Code Sign-In/Sign-Up */}
							{loginMethod === "code" && (
								<div className="space-y-4">
									{!codeSent ? (
										<div className="space-y-4">
											{authMode === "register" && (
												<div className="group">
													<label
														htmlFor="displayName"
														className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-pink-600 transition-colors"
													>
														Display Name
													</label>
													<input
														type="text"
														id="displayName"
														value={displayName}
														onChange={(e) => setDisplayName(e.target.value)}
														placeholder="Enter your display name"
														className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-300/50 focus:border-pink-500 transition-all duration-300 bg-white/50 backdrop-blur-sm disabled:opacity-60"
														disabled={codeLoading}
													/>
												</div>
											)}
											<div className="group">
												<label
													htmlFor="email"
													className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-pink-600 transition-colors"
												>
													Email Address
												</label>
												<input
													type="email"
													id="email"
													value={email}
													onChange={(e) => setEmail(e.target.value)}
													placeholder="Enter your email"
													className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-300/50 focus:border-pink-500 transition-all duration-300 bg-white/50 backdrop-blur-sm disabled:opacity-60"
													disabled={codeLoading}
												/>
											</div>
											<button
												onClick={() => handleSendCode(false)}
												className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
												disabled={codeLoading}
											>
												{codeLoading ? (
													<div className="flex items-center justify-center gap-2">
														<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
														<span>
															Sending{" "}
															{authMode === "login" ? "Login" : "Registration"}{" "}
															Code...
														</span>
													</div>
												) : (
													<span>
														Send{" "}
														{authMode === "login" ? "Login" : "Registration"}{" "}
														Code
													</span>
												)}
											</button>
										</div>
									) : (
										<div className="space-y-4">
											<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
														<svg
															className="w-4 h-4 text-white"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																fillRule="evenodd"
																d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																clipRule="evenodd"
															/>
														</svg>
													</div>
													<div>
														<p className="text-green-800 font-semibold">
															{authMode === "login" ? "Login" : "Registration"}{" "}
															code sent!
														</p>
														<p className="text-green-700 text-sm">
															Check your email for the 6-digit code
														</p>
													</div>
												</div>
											</div>
											<div className="group">
												<label
													htmlFor="code"
													className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-pink-600 transition-colors"
												>
													Verification Code
												</label>
												<VerificationCodeInput
													value={code}
													onChange={setCode}
													disabled={loading}
													error={!!error && error.includes("Invalid")}
												/>
											</div>

											{/* Resend Code Section */}
											<div className="text-center space-y-3">
												<div className="text-sm text-gray-600">
													Didn&apos;t receive the code?{" "}
													{resendCooldown > 0 ? (
														<span className="text-gray-500">
															Resend available in {resendCooldown}s
														</span>
													) : (
														<button
															onClick={() => handleSendCode(true)}
															disabled={resendLoading}
															className="text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
														>
															{resendLoading ? "Sending..." : "Resend code"}
														</button>
													)}
												</div>
											</div>

											<div className="flex gap-3">
												<button
													onClick={handleVerifyCode}
													className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
													disabled={loading || code.length !== 6}
												>
													{loading ? (
														<div className="flex items-center justify-center gap-2">
															<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
															<span>Verifying...</span>
														</div>
													) : (
														<span>Verify Code</span>
													)}
												</button>
												<button
													onClick={resetCodeForm}
													className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 hover:bg-gray-100 rounded-xl"
												>
													Back
												</button>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Switch Mode Links */}
							<div className="text-center pt-4 space-y-2">
								<button
									onClick={switchAuthMode}
									className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200 hover:underline block w-full"
								>
									{authMode === "login"
										? "Don't have an account? Register here"
										: "Already have an account? Sign in here"}
								</button>
								<button
									onClick={switchLoginMethod}
									className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200 hover:underline block w-full"
								>
									{loginMethod === "google"
										? "Or sign in with code"
										: "Or sign in with Google"}
								</button>
							</div>

							{/* Feature highlights */}
							<div className="pt-6 space-y-3">
								<div className="flex items-center gap-3 text-sm text-gray-600">
									<div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
									<span>Premium quality cosmetics</span>
								</div>
								<div className="flex items-center gap-3 text-sm text-gray-600">
									<div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
									<span>Advanced virtual try-on technology</span>
								</div>
								<div className="flex items-center gap-3 text-sm text-gray-600">
									<div className="w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"></div>
									<span>Secure authentication options</span>
								</div>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="mt-6">
							<div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl py-3 px-4 shadow-sm">
								<div className="flex items-center gap-3">
									<div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
										<svg
											className="w-3 h-3 text-white"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<p className="text-red-700 text-sm font-medium">{error}</p>
								</div>
							</div>
						</div>
					)}

					{/* Footer */}
					<div className="mt-8 text-center">
						<p className="text-xs text-gray-400">
							By {authMode === "login" ? "signing in" : "registering"}, you
							agree to our terms of service
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
