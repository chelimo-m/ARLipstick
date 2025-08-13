/**
 * AR Lipstick Utilities
 *
 * This module handles all the core functionality for the AR lipstick try-on feature.
 * It includes camera setup, face landmark detection, color conversion utilities,
 * and the main lipstick rendering logic.
 */

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Type definition for 2D landmark points
export type Landmark = { x: number; y: number };

/**
 * Sets up the user's camera for video capture
 *
 * Requests camera permissions and initializes the video stream with
 * a standard resolution of 320x240 pixels for optimal performance.
 *
 * @param videoRef - React ref to the video element
 * @returns Promise that resolves to true if camera setup succeeds, false otherwise
 */
export async function setupCamera(
	videoRef: React.RefObject<HTMLVideoElement | null>
): Promise<boolean> {
	try {
		// Request camera access with specific dimensions
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 320, height: 240 },
		});

		// Attach the stream to the video element
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
		}
		return true;
	} catch (error) {
		// Camera access denied or other error
		console.warn("Camera setup failed:", error);
		return false;
	}
}

/**
 * Loads and initializes the MediaPipe face landmark detection model
 *
 * Downloads the pre-trained face landmark model from Google's CDN and
 * configures it for real-time video processing.
 *
 * @returns Promise that resolves to a configured FaceLandmarker instance
 */
export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
	// Load the MediaPipe vision tasks library
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
	);

	// Create and configure the face landmark detector
	return await FaceLandmarker.createFromOptions(vision, {
		baseOptions: {
			// Use the optimized float16 model for better performance
			modelAssetPath:
				"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
		},
		runningMode: "VIDEO", // Optimized for continuous video processing
	});
}

/**
 * Detects facial landmarks from the current video frame
 *
 * Captures the current video frame, processes it through the face landmark
 * detector, and returns the detected facial keypoints in pixel coordinates.
 *
 * @param faceLandmarker - Initialized MediaPipe face landmark detector
 * @param videoRef - React ref to the video element
 * @returns Array of landmark coordinates or null if no face detected
 */
export function detectLandmarks(
	faceLandmarker: FaceLandmarker,
	videoRef: React.RefObject<HTMLVideoElement | null>
): Landmark[] | null {
	// Check if video is ready and playing
	if (!videoRef.current || videoRef.current.readyState !== 4) return null;

	const video = videoRef.current;
	const width = video.videoWidth;
	const height = video.videoHeight;

	// Create offscreen canvas for processing
	const offscreen = document.createElement("canvas");
	offscreen.width = width;
	offscreen.height = height;
	const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

	// Draw current video frame to canvas
	offCtx!.drawImage(video, 0, 0, width, height);

	// Run face detection on the frame
	const results = faceLandmarker.detectForVideo(offscreen, performance.now());

	// Extract landmarks if face detected
	if (results.faceLandmarks && results.faceLandmarks.length > 0) {
		// Convert normalized coordinates (0-1) to pixel coordinates
		return results.faceLandmarks[0].map((kp: { x: number; y: number }) => ({
			x: kp.x * width,
			y: kp.y * height,
		}));
	}
	return null;
}

/**
 * Linear interpolation between two values
 *
 * Smoothly transitions between value a and b based on interpolation factor t.
 * Used for smoothing landmark movements to reduce jitter.
 *
 * @param a - Starting value
 * @param b - Ending value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Color conversion utilities for realistic lipstick rendering
 *
 * These functions handle conversion between RGB and HSV color spaces,
 * which is essential for natural-looking lipstick application that
 * preserves skin texture while changing color.
 */

/**
 * Converts RGB color values to HSV (Hue, Saturation, Value)
 *
 * HSV is better for color manipulation because it separates color (hue),
 * intensity (saturation), and brightness (value) components.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns [hue, saturation, value] where hue is 0-360, sat/value are 0-1
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
	// Normalize RGB values to 0-1 range
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h: number | undefined;
	const d = max - min;
	const v = max;
	const s = max === 0 ? 0 : d / max;

	// Calculate hue based on which component is dominant
	if (max === min) {
		h = 0; // Grayscale
	} else {
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
		h! /= 6;
	}
	return [h ?? 0, s, v];
}

/**
 * Converts HSV color values back to RGB
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param v - Value/Brightness (0-1)
 * @returns [red, green, blue] components in 0-255 range
 */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
	h = h ?? 0;
	h /= 60; // Convert to 0-6 range

	const c = v * s; // Chroma
	const x = c * (1 - Math.abs((h % 2) - 1));
	const m = v - c;

	let r = 0,
		g = 0,
		b = 0;

	// Determine RGB values based on hue sector
	if (0 <= h && h < 1) {
		r = c;
		g = x;
		b = 0;
	} else if (1 <= h && h < 2) {
		r = x;
		g = c;
		b = 0;
	} else if (2 <= h && h < 3) {
		r = 0;
		g = c;
		b = x;
	} else if (3 <= h && h < 4) {
		r = 0;
		g = x;
		b = c;
	} else if (4 <= h && h < 5) {
		r = x;
		g = 0;
		b = c;
	} else if (5 <= h && h < 6) {
		r = c;
		g = 0;
		b = x;
	}

	// Convert back to 0-255 range
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return [r, g, b];
}

/**
 * Converts a hex color string to HSL (Hue, Saturation, Lightness)
 *
 * Used for color manipulation in the UI and for creating color variations.
 * HSL is more intuitive for color adjustments than RGB.
 *
 * @param hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns Object with h (0-360), s (0-100), l (0-100) values
 */
export function hexToHSL(hex: string) {
	// Remove the # if present
	hex = hex.replace("#", "");

	// Parse the hex values - handle both 3 and 6 character formats
	let r = 0,
		g = 0,
		b = 0;
	if (hex.length === 3) {
		// Expand 3-char hex (e.g., "F0A" -> "FF00AA")
		r = parseInt(hex[0] + hex[0], 16);
		g = parseInt(hex[1] + hex[1], 16);
		b = parseInt(hex[2] + hex[2], 16);
	} else if (hex.length === 6) {
		// Standard 6-char hex format
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
	}

	// Normalize RGB values to 0-1 range
	r /= 255;
	g /= 255;
	b /= 255;

	// Find the maximum and minimum values for HSL calculation
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2; // Lightness is the average of max and min

	// Calculate saturation and hue
	if (max !== min) {
		const d = max - min;
		// Saturation calculation depends on lightness
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		// Calculate hue based on which component is dominant
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
		h /= 6; // Normalize to 0-1
	}

	// Convert to standard HSL ranges
	return {
		h: Math.round(h * 360), // Hue: 0-360 degrees
		s: Math.round(s * 100), // Saturation: 0-100%
		l: Math.round(l * 100), // Lightness: 0-100%
	};
}

/**
 * Converts HSL color values to a hex color string
 *
 * Inverse of hexToHSL - converts HSL values back to hex format
 * for use in CSS and other color applications.
 *
 * @param h - Hue (0-360 degrees)
 * @param s - Saturation (0-100%)
 * @param l - Lightness (0-100%)
 * @returns Hex color string (e.g., "#FF0000")
 */
export function hslToHex(h: number, s: number, l: number) {
	// Normalize HSL values to 0-1 range
	s /= 100;
	l /= 100;

	// Calculate chroma (color intensity)
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2; // Amount of white/black to add

	let r = 0,
		g = 0,
		b = 0;

	// Convert to RGB based on hue sector (60-degree segments)
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

	// Convert to 0-255 range
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	// Convert to hex string with proper padding
	const toHex = (n: number) => n.toString(16).padStart(2, "0");
	return "#" + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Renders virtual lipstick on the user's lips in real-time
 *
 * This is the core function that applies lipstick color to the detected lip area.
 * It uses advanced computer vision techniques to:
 * - Detect and track lip contours using facial landmarks
 * - Create smooth, natural-looking lip shapes
 * - Apply realistic color blending that preserves skin texture
 * - Add appropriate lighting and finish effects (matte/gloss)
 *
 * @param canvasRef - React ref to the canvas element for rendering
 * @param prevLandmarks - Previous frame's landmark positions for smoothing
 * @param targetLandmarks - Current frame's detected landmark positions
 * @param lipColor - Hex color string for the lipstick (e.g., "#FF0000")
 * @param SMOOTHING - Interpolation factor for landmark smoothing (0-1)
 * @param finish - Lipstick finish type: "matte" or "gloss"
 */
export function renderLipstick(
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	prevLandmarks: { x: number; y: number }[] | null,
	targetLandmarks: { x: number; y: number }[] | null,
	lipColor: string,
	SMOOTHING: number,
	finish: "matte" | "gloss" = "matte"
) {
	// Validate inputs and get canvas context
	if (
		!canvasRef.current ||
		!prevLandmarks ||
		!targetLandmarks ||
		prevLandmarks.length !== targetLandmarks.length
	) {
		return;
	}

	const mainCanvas = canvasRef.current;
	const ctx = mainCanvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return;

	// Apply smoothing to reduce jitter in landmark tracking
	prevLandmarks.forEach((landmark, idx) => {
		landmark.x = lerp(landmark.x, targetLandmarks[idx].x, SMOOTHING);
		landmark.y = lerp(landmark.y, targetLandmarks[idx].y, SMOOTHING);
	});
	const keypoints = prevLandmarks;

	// Define lip contour landmark indices for MediaPipe face mesh
	// These indices correspond to specific points around the outer and inner lip edges
	const denseOuterLip = [
		61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84,
		181, 91, 146, 61,
	];
	const denseInnerLip = [
		78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14,
		87, 178, 88, 95, 78,
	];

	/**
	 * Catmull-Rom spline interpolation for creating smooth lip contours
	 *
	 * This function creates smooth curves between discrete landmark points
	 * by interpolating additional points using cubic spline mathematics.
	 * This results in natural-looking lip shapes instead of jagged polygons.
	 *
	 * @param points - Array of landmark points to interpolate
	 * @param numPoints - Number of interpolated points to generate per segment
	 * @returns Array of smooth interpolated points
	 */
	function catmullRomSpline(
		points: { x: number; y: number }[],
		numPoints: number = 100
	): { x: number; y: number }[] {
		// Cubic interpolation function using Catmull-Rom formula
		function interpolate(
			p0: number,
			p1: number,
			p2: number,
			p3: number,
			t: number
		): number {
			return (
				0.5 *
				(2 * p1 +
					(-p0 + p2) * t +
					(2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
					(-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
			);
		}

		const result: { x: number; y: number }[] = [];

		// Interpolate between each pair of points
		for (let i = 0; i < points.length - 1; i++) {
			// Get control points for smooth interpolation
			const p0 = points[i === 0 ? 0 : i - 1];
			const p1 = points[i];
			const p2 = points[i + 1 < points.length ? i + 1 : i];
			const p3 =
				points[
					i + 2 < points.length ? i + 2 : i + 1 < points.length ? i + 1 : i
				];

			// Generate interpolated points along this segment
			for (let t = 0; t < 1; t += 1 / numPoints) {
				result.push({
					x: interpolate(p0.x, p1.x, p2.x, p3.x, t),
					y: interpolate(p0.y, p1.y, p2.y, p3.y, t),
				});
			}
		}
		return result;
	}

	// Create a separate canvas for the lip mask
	// This allows us to create complex shapes and apply effects independently
	const maskCanvas = document.createElement("canvas");
	maskCanvas.width = mainCanvas.width;
	maskCanvas.height = mainCanvas.height;
	const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
	if (!maskCtx) return;

	// Clear the mask canvas
	maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

	// Create a copy of keypoints for adjustments
	const adjustedKeypoints = keypoints.map((kp) => ({
		x: kp.x,
		y: kp.y,
	}));

	// Fine-tune corner positions for more natural lip shapes
	// These small adjustments help create better-looking lip contours
	const cornerOffset = 1;
	const upOffset = 0;
	if (adjustedKeypoints[61]) {
		adjustedKeypoints[61].x -= cornerOffset;
		adjustedKeypoints[61].y -= upOffset;
	}
	if (adjustedKeypoints[291]) {
		adjustedKeypoints[291].x += cornerOffset;
		adjustedKeypoints[291].y -= upOffset;
	}

	// Extract lip contour points and create smooth curves
	const outerPoints = denseOuterLip.map((idx) => adjustedKeypoints[idx]);
	const innerPoints = denseInnerLip.map((idx) => adjustedKeypoints[idx]);
	const smoothOuter = catmullRomSpline(outerPoints, 60);
	const smoothInner = catmullRomSpline(innerPoints, 60);

	// Draw lip mask
	maskCtx.save();
	maskCtx.beginPath();

	// Trace outer contour
	for (let j = 0; j < smoothOuter.length; j++) {
		const kp = smoothOuter[j];
		if (j === 0) {
			maskCtx.moveTo(kp.x, kp.y);
		} else {
			maskCtx.lineTo(kp.x, kp.y);
		}
	}

	// At the right corner, jump to the corresponding inner point (sharp V)
	const rightInner = smoothInner[smoothInner.length - 1];
	maskCtx.lineTo(rightInner.x, rightInner.y);

	// Trace inner contour in reverse
	for (let j = smoothInner.length - 2; j >= 0; j--) {
		const kp = smoothInner[j];
		maskCtx.lineTo(kp.x, kp.y);
	}

	// At the left corner, close the V
	const leftOuter = smoothOuter[0];
	maskCtx.lineTo(leftOuter.x, leftOuter.y);
	maskCtx.closePath();

	maskCtx.fillStyle = "#fff";
	maskCtx.shadowColor = "#fff";
	maskCtx.shadowBlur = 6;
	maskCtx.globalAlpha = 0.85;
	maskCtx.fill("evenodd");
	maskCtx.restore();

	// Create feathered mask
	const featheredMaskCanvas = document.createElement("canvas");
	featheredMaskCanvas.width = maskCanvas.width;
	featheredMaskCanvas.height = maskCanvas.height;
	const featheredMaskCtx = featheredMaskCanvas.getContext("2d", {
		willReadFrequently: true,
	});
	if (!featheredMaskCtx) return;

	featheredMaskCtx.drawImage(maskCanvas, 0, 0);
	featheredMaskCtx.globalCompositeOperation = "source-in";
	featheredMaskCtx.filter = "blur(4px)";
	featheredMaskCtx.drawImage(maskCanvas, 0, 0);
	featheredMaskCtx.filter = "none";
	featheredMaskCtx.globalAlpha = 0.85;
	featheredMaskCtx.globalCompositeOperation = "source-in";
	featheredMaskCtx.fillStyle = lipColor;
	featheredMaskCtx.fillRect(
		0,
		0,
		featheredMaskCanvas.width,
		featheredMaskCanvas.height
	);
	featheredMaskCtx.globalAlpha = 1.0;
	featheredMaskCtx.globalCompositeOperation = "source-over";

	// Clear main canvas and draw video frame
	ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

	// Draw the current video frame to the canvas
	const video = document.querySelector("video") as HTMLVideoElement;
	if (!video || video.readyState !== 4) {
		// If video is not ready, just return without rendering
		return;
	}

	ctx.drawImage(video, 0, 0, mainCanvas.width, mainCanvas.height);

	// Get frame data for pixel manipulation
	const frame = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
	const maskData = maskCtx.getImageData(
		0,
		0,
		mainCanvas.width,
		mainCanvas.height
	);

	// Parse lipColor to HSV
	const hex = lipColor.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const [targetH, targetS, targetV0] = rgbToHsv(r, g, b);
	let targetV = targetV0;

	// Dynamic lighting adaptation
	let sumV = 0,
		count = 0;
	for (let j = 0; j < maskData.data.length; j += 4) {
		const alpha = maskData.data[j + 3] / 255;
		if (alpha > 0.1) {
			const [, , v] = rgbToHsv(
				frame.data[j],
				frame.data[j + 1],
				frame.data[j + 2]
			);
			sumV += v;
			count++;
		}
	}
	const avgV = count > 0 ? sumV / count : 0.5;
	targetV = Math.max(0.15, Math.min(1, avgV + 0.15));

	// Texture-preserving blending
	for (let j = 0; j < maskData.data.length; j += 4) {
		const alpha = maskData.data[j + 3] / 255;
		if (alpha > 0.05) {
			// Get original pixel HSV
			const [origH, origS, v] = rgbToHsv(
				frame.data[j],
				frame.data[j + 1],
				frame.data[j + 2]
			);

			// Blend hue/sat, preserve value (texture)
			const newH = targetH * 0.85 + origH * 0.15;
			const newS = Math.max(origS, targetS * 0.85);
			let newV = v * (1 - alpha) + targetV * alpha;

			// For matte, reduce gloss
			if (finish === "matte") newV *= 0.97;

			// For gloss, add highlight
			if (finish === "gloss" && v > 0.85 && origS < 0.3) {
				newV = Math.min(1, newV + 0.1);
			}

			const [nr, ng, nb] = hsvToRgb(newH, newS, newV);
			const featherAlpha = Math.min(1, alpha * 1.1);

			frame.data[j] = Math.round(
				nr * featherAlpha + frame.data[j] * (1 - featherAlpha)
			);
			frame.data[j + 1] = Math.round(
				ng * featherAlpha + frame.data[j + 1] * (1 - featherAlpha)
			);
			frame.data[j + 2] = Math.round(
				nb * featherAlpha + frame.data[j + 2] * (1 - featherAlpha)
			);
		}
	}

	ctx.putImageData(frame, 0, 0);

	// Enhanced gloss highlight for 'gloss' finish
	if (finish === "gloss") {
		ctx.save();
		ctx.globalAlpha = 0.22;
		ctx.globalCompositeOperation = "lighter";
		ctx.beginPath();

		// Draw a highlight arc along the upper lip
		const highlight = smoothOuter.slice(10, 30);
		for (let k = 0; k < highlight.length; k++) {
			const kp = highlight[k];
			if (k === 0) ctx.moveTo(kp.x, kp.y - 5);
			else ctx.lineTo(kp.x, kp.y - 5);
		}

		ctx.lineWidth = 8;
		ctx.strokeStyle = "#fff";
		ctx.shadowColor = "#fff";
		ctx.shadowBlur = 12;
		ctx.stroke();
		ctx.restore();
	}
}

/**
 * Starts the AR lipstick try-on experience
 *
 * This function initializes the complete AR pipeline:
 * 1. Sets up camera access and video stream
 * 2. Loads the face landmark detection model
 * 3. Starts a continuous rendering loop that:
 *    - Detects facial landmarks in real-time
 *    - Applies lipstick color to detected lips
 *    - Handles face tracking and smoothing
 *
 * @param videoEl - Video element for camera input
 * @param canvasEl - Canvas element for AR rendering
 * @param color - Hex color string for the lipstick
 * @returns Cleanup function to stop the AR experience
 */
export async function startLipstickAR(
	videoEl: HTMLVideoElement,
	canvasEl: HTMLCanvasElement,
	color: string
) {
	// Initialize camera and face detection
	await setupCamera({ current: videoEl });
	const faceLandmarker = await loadFaceLandmarker();

	// State variables for tracking and smoothing
	let prevLandmarks: Landmark[] | null = null;
	const SMOOTHING = 0.5; // Controls how much smoothing is applied
	let running = true;

	/**
	 * Main rendering loop - runs continuously at 60fps
	 *
	 * This function handles the real-time AR rendering:
	 * - Detects facial landmarks in each frame
	 * - Applies lipstick color to detected lips
	 * - Clears canvas when no face is detected
	 * - Maintains smooth tracking between frames
	 */
	async function render() {
		if (!running) return;

		// Detect landmarks in current frame
		const landmarks = detectLandmarks(faceLandmarker, { current: videoEl });

		if (landmarks) {
			// Initialize previous landmarks if this is the first detection
			if (!prevLandmarks) prevLandmarks = landmarks;

			// Render lipstick on detected lips
			renderLipstick(
				{ current: canvasEl },
				prevLandmarks,
				landmarks,
				color,
				SMOOTHING,
				"matte"
			);

			// Store current landmarks for next frame smoothing
			prevLandmarks = landmarks;
		} else {
			// No face detected - clear the canvas
			const ctx = canvasEl.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
			}
		}

		// Schedule next frame
		requestAnimationFrame(render);
	}

	// Start the rendering loop
	render();

	// Return cleanup function to stop AR experience
	return () => {
		running = false;
	};
}
