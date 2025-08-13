"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
	setupCamera,
	loadFaceLandmarker,
	detectLandmarks,
	renderLipstick,
} from "../../ar/arUtils";
import Image from "next/image";

export type LipstickProduct = {
	id: number;
	name: string;
	color: string;
	image: string;
};

type ARLipstickTryOnProps = {
	products?: LipstickProduct[];
	initialColor?: string;
	showControls?: boolean;
	onColorChange?: (color: string) => void;
	className?: string;
};

// Utility: Convert hex to HSL and back
function hexToHSL(hex: string) {
	// Remove #
	hex = hex.replace("#", "");
	let r = 0,
		g = 0,
		b = 0;
	if (hex.length === 3) {
		r = parseInt(hex[0] + hex[0], 16);
		g = parseInt(hex[1] + hex[1], 16);
		b = parseInt(hex[2] + hex[2], 16);
	} else if (hex.length === 6) {
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
	}
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

function hslToHex(h: number, s: number, l: number) {
	s /= 100;
	l /= 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0,
		g = 0,
		b = 0;
	if (0 <= h && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= h && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		g = 0;
		b = x;
	}
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);
	return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export default function ARLipstickTryOn({
	products = [
		{ id: 1, name: "Ruby Red", color: "#dc3753", image: "/file.svg" },
		{ id: 2, name: "Blush Pink", color: "#f472b6", image: "/globe.svg" },
		{ id: 3, name: "Coral Crush", color: "#fb7185", image: "/window.svg" },
	],
	initialColor = "#dc3753",
	showControls = true,
	onColorChange,
	className = "",
}: ARLipstickTryOnProps) {
	const videoRef = useRef<HTMLVideoElement>(
		null
	) as React.RefObject<HTMLVideoElement>;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState("");
	const [lipColor, setLipColor] = useState(initialColor);
	const [hue, setHue] = useState<number>(hexToHSL(initialColor).h);
	const [baseColor, setBaseColor] = useState<string>(initialColor);
	const [loading, setLoading] = useState(true);
	const [started, setStarted] = useState(false);
	const failedFrames = useRef<number>(0);

	// Smoothing state
	type Landmark = { x: number; y: number };
	const prevLandmarks = useRef<Landmark[] | null>(null);
	const targetLandmarks = useRef<Landmark[] | null>(null);
	const DETECT_INTERVAL = 40;
	const SMOOTHING = 0.85;

	// Fix animationId by using useRef and fix useEffect dependencies
	const animationIdRef = useRef<number | null>(null);

	// Wrap renderStep in useCallback and fix useEffect dependencies
	const renderStep = useCallback(() => {
		if (
			videoRef.current &&
			videoRef.current.readyState === 4 &&
			canvasRef.current &&
			targetLandmarks.current
		) {
			renderLipstick(
				canvasRef,
				prevLandmarks.current,
				targetLandmarks.current,
				lipColor,
				SMOOTHING
			);
		}
		animationIdRef.current = requestAnimationFrame(renderStep);
	}, [lipColor]);

	useEffect(() => {
		if (!started) return;
		let faceLandmarker: FaceLandmarker | null = null,
			detectTimer: ReturnType<typeof setTimeout>;
		let running = true;
		const video = videoRef.current; // Capture ref value for cleanup

		async function loadModelAndDetect() {
			try {
				faceLandmarker = await loadFaceLandmarker();
				setLoading(false);
				setError("");
				startDetectionLoop();
				startRenderLoop();
			} catch {
				setError(
					"Failed to load face landmarks model. Please refresh the page, check your internet connection, or contact support."
				);
				setLoading(false);
			}
		}

		async function detectionStep() {
			if (
				videoRef.current &&
				videoRef.current.readyState === 4 &&
				canvasRef.current &&
				faceLandmarker
			) {
				try {
					const landmarks = detectLandmarks(faceLandmarker, videoRef);
					if (landmarks) {
						failedFrames.current = 0;
						targetLandmarks.current = landmarks;
						if (!prevLandmarks.current) {
							prevLandmarks.current = landmarks.map((kp) => ({ ...kp }));
						}
						setError("");
					} else {
						failedFrames.current++;
						if (failedFrames.current > 10) {
							setError(
								"Face detection failed. Please ensure your camera is working, your face is well-lit, and fully visible to the camera."
							);
						}
					}
				} catch {
					failedFrames.current++;
					if (failedFrames.current > 10) {
						setError(
							"Face detection failed due to an internal error. Please refresh the page, check your camera, or try a different browser."
						);
					}
				}
			}
			if (running) {
				detectTimer = setTimeout(detectionStep, DETECT_INTERVAL);
			}
		}

		function startDetectionLoop() {
			detectionStep();
		}
		function startRenderLoop() {
			renderStep();
		}

		setupCamera(videoRef).then((success) => {
			if (success) loadModelAndDetect();
			else {
				setError(
					"Camera access is required for the LushLips demo. Please allow camera access in your browser settings."
				);
				setLoading(false);
			}
		});
		return () => {
			running = false;
			if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
			if (detectTimer) clearTimeout(detectTimer);
			if (video && video.srcObject) {
				(video.srcObject as MediaStream)
					.getTracks()
					.forEach((track) => track.stop());
			}
		};
	}, [started, renderStep]);

	// Replace demo-specific UI (headlines, marketing text, etc.) with only AR preview and controls if showControls is true
	if (!started) {
		return (
			<div
				className={`w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-100 rounded-2xl shadow-2xl p-0 md:p-12 relative overflow-hidden ${className}`}
			>
				<div className="flex flex-col items-center justify-center w-full h-full py-16">
					{/* Lipstick SVG Icon */}
					<svg
						width="64"
						height="64"
						viewBox="0 0 36 36"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="mb-4 drop-shadow-lg"
					>
						<rect x="15" y="8" width="6" height="14" rx="3" fill="#dc3753" />
						<rect x="13" y="22" width="10" height="6" rx="2" fill="#fbb6ce" />
						<rect x="15" y="28" width="6" height="3" rx="1.5" fill="#e11d48" />
						<rect x="16.5" y="5" width="3" height="5" rx="1.5" fill="#f472b6" />
					</svg>
					<h3 className="text-2xl md:text-3xl font-bold text-pink-600 mb-2 text-center">
						Get Ready to Try On Lipstick!
					</h3>
					<button
						onClick={() => setStarted(true)}
						className="px-10 py-4 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition font-semibold text-xl mt-4 mb-2 focus:outline-none focus:ring-4 focus:ring-pink-300"
					>
						Start LushLips
					</button>
					{loading && (
						<div className="text-gray-500 mt-2 text-sm animate-pulse text-center">
							Initializing camera and model...
						</div>
					)}
					{error && (
						<div className="text-red-600 mt-2 text-base font-medium text-center">
							{error}
						</div>
					)}
				</div>
			</div>
		);
	}
	return (
		<div
			className={`w-full flex flex-col md:flex-row gap-8 items-start justify-center p-4 md:p-8 ${className}`}
		>
			{/* AR Preview */}
			<div className="flex-1 flex flex-col items-center">
				<div className="relative flex items-center justify-center border-4 border-pink-200 bg-white/70 rounded-3xl mx-auto shadow-2xl backdrop-blur-lg transition-all duration-300 w-full aspect-video max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto">
					<video
						ref={videoRef}
						autoPlay
						muted
						playsInline
						className="absolute top-0 left-0 w-full h-full object-cover rounded-3xl shadow-lg"
						style={{ transform: "scaleX(-1)" }}
					/>
					<canvas
						ref={canvasRef}
						className="absolute top-0 left-0 w-full h-full rounded-3xl pointer-events-none"
					/>
				</div>
				{loading && (
					<div className="text-gray-500 mt-4 text-sm animate-pulse">
						Initializing camera and model...
					</div>
				)}
				{error && (
					<div className="text-red-600 mt-4 text-base font-medium">{error}</div>
				)}
			</div>
			{/* Controls */}
			{showControls && (
				<div className="flex-1 w-full max-w-md bg-white/70 rounded-2xl shadow-2xl border border-pink-100 p-8 flex flex-col items-center backdrop-blur-md">
					<h3 className="text-2xl font-bold text-pink-600 mb-6">
						Choose Your Lipstick
					</h3>
					<div className="grid grid-cols-3 gap-4 mb-8 w-full">
						{products.map((product) => (
							<button
								key={product.id}
								onClick={() => {
									setBaseColor(product.color);
									const hsl = hexToHSL(product.color);
									setHue(hsl.h);
									setLipColor(product.color);
									if (onColorChange) {
										onColorChange(product.color);
									}
								}}
								className={`flex flex-col items-center p-3 rounded-xl border-2 transition shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-400 ${
									lipColor === product.color
										? "border-pink-500 bg-pink-50 ring-2 ring-pink-300"
										: "border-pink-100 bg-white"
								}`}
								style={{
									boxShadow:
										lipColor === product.color
											? "0 0 16px 2px #f472b6"
											: undefined,
								}}
							>
								<Image
									src={product.image}
									alt={product.name}
									width={48}
									height={48}
									className="w-12 h-12 mb-2 rounded-full border border-pink-200 object-cover"
								/>
								<span className="text-sm font-semibold text-gray-700 mb-1">
									{product.name}
								</span>
								<span
									className="w-6 h-6 rounded-full border-2 border-gray-200"
									style={{ background: product.color }}
								/>
							</button>
						))}
					</div>
					<div className="w-full flex flex-col items-center">
						<label
							htmlFor="hueRange"
							className="text-gray-700 font-medium mb-2"
						>
							Fine-tune Hue
						</label>
						<div className="flex items-center gap-4 mb-4 w-full">
							<div className="w-14 h-14 rounded-full border-4 border-pink-300 shadow-inner bg-white flex items-center justify-center">
								<div
									className="w-10 h-10 rounded-full shadow-lg border-2 border-white"
									style={{ background: lipColor }}
								/>
							</div>
							<input
								id="hueRange"
								type="range"
								min="0"
								max="360"
								value={hue}
								onChange={(e) => {
									const newHue = parseInt(e.target.value, 10);
									setHue(newHue);
									const hsl = hexToHSL(baseColor);
									const newColor = hslToHex(newHue, hsl.s, hsl.l);
									setLipColor(newColor);
									if (onColorChange) {
										onColorChange(newColor);
									}
								}}
								className="w-48 accent-pink-500 bg-gradient-to-r from-red-400 via-pink-400 to-yellow-300 rounded-full h-2 appearance-none"
								style={{
									background:
										"linear-gradient(90deg, #dc3753 0%, #f472b6 25%, #fb7185 50%, #a21caf 75%, #fbbf24 100%)",
								}}
							/>
							<span
								className="text-sm font-mono text-gray-500 select-all cursor-pointer"
								title="Copy"
								onClick={() => navigator.clipboard.writeText(lipColor)}
							>
								{lipColor.toUpperCase()}
							</span>
						</div>
						<div className="flex gap-2 mt-2 flex-wrap justify-center">
							{[0, 15, 30, 45, 60, 90, 120, 180, 210, 240, 270, 300, 330].map(
								(hueVal) => {
									const hsl = hexToHSL(baseColor);
									const swatch = hslToHex(hueVal, hsl.s, hsl.l);
									return (
										<button
											key={hueVal}
											className={`w-8 h-8 rounded-full border-2 ${
												lipColor === swatch
													? "border-pink-500 scale-110 ring-2 ring-pink-300"
													: "border-gray-200"
											} transition-transform shadow-md hover:scale-110 relative group`}
											style={{ background: swatch }}
											onClick={() => {
												setHue(hueVal);
												setLipColor(swatch);
												if (onColorChange) {
													onColorChange(swatch);
												}
											}}
											aria-label={`Set hue ${hueVal}`}
										>
											<span className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 bg-white text-xs text-pink-600 font-semibold px-2 py-1 rounded shadow pointer-events-none transition-all">
												Try this shade!
											</span>
										</button>
									);
								}
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
