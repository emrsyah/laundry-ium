type HapticType = "light" | "medium" | "heavy" | "success" | "error";

const patterns: Record<HapticType, number | number[]> = {
	light: 10,
	medium: 20,
	heavy: 30,
	success: [10, 50, 10],
	error: [30, 30, 30],
};

export function haptic(type: HapticType = "light") {
	if (typeof navigator === "undefined" || !navigator.vibrate) return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	navigator.vibrate(patterns[type]);
}
