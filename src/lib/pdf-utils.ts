import { jsPDF } from "jspdf";
import { formatDate, formatRupiah } from "./utils";

type ReceiptOrder = {
	id: number;
	customerName: string;
	customerPhone: string;
	nominal: number;
	paymentStatus: string;
	paymentMethod: string | null;
	createdAt: Date | string;
	estimatedCompletion?: Date | string | null;
	items: {
		id: number;
		serviceName: string;
		quantity: number;
		unitPrice: number;
		subtotal: number;
	}[];
};

type ReceiptSettings = {
	name: string;
	address: string;
};

// ── Colour palette (hex) ────────────────────────────────────────────
const C = {
	black: "#0f172a",
	dark: "#1e293b",
	mid: "#64748b",
	light: "#94a3b8",
	faint: "#e2e8f0",
	bg: "#f8fafc",
	white: "#ffffff",
	primary: "#c026d3", // fuchsia-600, matches the oklch primary
	emerald: "#059669",
	amber: "#d97706",
} as const;

// Receipt dimensions (in pt, 1 pt ≈ 0.353 mm)
const WIDTH = 226; // ~80 mm thermal receipt width
const MARGIN = 16;
const CONTENT_W = WIDTH - MARGIN * 2;

/**
 * Generates a receipt PDF by drawing directly with jsPDF.
 * No html2canvas / html-to-image — zero CSS compatibility issues.
 *
 * The second argument (`_element`) is kept for API compatibility but ignored.
 */
export async function generateReceiptPDF(
	orderId: number,
	_element: HTMLElement | null,
	data?: { order: ReceiptOrder; settings: ReceiptSettings },
) {
	if (!data) {
		console.error("Receipt data not provided!");
		throw new Error("Receipt data is required for PDF generation");
	}

	const { order, settings } = data;

	// Two-pass: first pass calculates height, second pass draws on correct-sized page.
	const finalH = measureReceipt(order, settings);

	const pdf = new jsPDF({
		orientation: "portrait",
		unit: "pt",
		format: [WIDTH, finalH],
	});

	drawReceipt(pdf, order, settings);

	pdf.save(`Struk-Laundry-${orderId.toString().padStart(4, "0")}.pdf`);
	return true;
}

// ── Drawing helpers ─────────────────────────────────────────────────

function setFont(
	pdf: jsPDF,
	size: number,
	style: "normal" | "bold" = "normal",
	color: string = C.dark,
) {
	pdf.setFontSize(size);
	pdf.setFont("helvetica", style);
	pdf.setTextColor(color);
}

function drawLine(pdf: jsPDF, yPos: number, dashed = false) {
	pdf.setDrawColor(C.faint);
	pdf.setLineWidth(0.5);
	if (dashed) {
		pdf.setLineDashPattern([2, 2], 0);
	} else {
		pdf.setLineDashPattern([], 0);
	}
	pdf.line(MARGIN, yPos, WIDTH - MARGIN, yPos);
	pdf.setLineDashPattern([], 0);
}

function centerText(
	pdf: jsPDF,
	text: string,
	yPos: number,
	size: number,
	style: "normal" | "bold" = "normal",
	color: string = C.dark,
) {
	setFont(pdf, size, style, color);
	pdf.text(text, WIDTH / 2, yPos, { align: "center" });
}

function rowLR(
	pdf: jsPDF,
	left: string,
	right: string,
	yPos: number,
	leftOpts?: { size?: number; style?: "normal" | "bold"; color?: string },
	rightOpts?: { size?: number; style?: "normal" | "bold"; color?: string },
) {
	setFont(
		pdf,
		leftOpts?.size ?? 7,
		leftOpts?.style ?? "normal",
		leftOpts?.color ?? C.light,
	);
	pdf.text(left.toUpperCase(), MARGIN, yPos);
	setFont(
		pdf,
		rightOpts?.size ?? 8,
		rightOpts?.style ?? "bold",
		rightOpts?.color ?? C.black,
	);
	pdf.text(right, WIDTH - MARGIN, yPos, { align: "right" });
}

// ── Measure pass (dry-run to calculate total height) ────────────────

function measureReceipt(order: ReceiptOrder, settings: ReceiptSettings): number {
	// Simulate the layout to find the final y position
	const dummyPdf = new jsPDF({ unit: "pt", format: [WIDTH, 2000] });
	let y = MARGIN;

	// Header
	y += 20; // store name
	if (settings.address) {
		const lines = dummyPdf.splitTextToSize(settings.address, CONTENT_W - 20);
		y += lines.length > 1 ? lines.length * 7 : 10;
	}
	y += 8 + 10; // divider

	// Order info
	y += 12 + 12 + 14; // 3 rows
	y += 10; // divider

	// Table header
	y += 4 + 8;

	// Items
	y += order.items.length * 19; // 9 + 10 per item
	y += 4;

	// Totals box
	y += 12 + 12 + 12; // total + status + padding
	if (order.paymentMethod) y += 12;
	y += 6;

	// Estimated completion
	if (order.estimatedCompletion) y += 34;
	y += 6;

	// Footer
	y += 12 + 10 + 8;

	return y + MARGIN;
}

// ── Main draw function ──────────────────────────────────────────────

function drawReceipt(
	pdf: jsPDF,
	order: ReceiptOrder,
	settings: ReceiptSettings,
) {
	let y = MARGIN;
	const payColor = order.paymentStatus === "LUNAS" ? C.emerald : C.amber;

	// ── Header ──────────────────────────────────────────────────────
	centerText(
		pdf,
		(settings.name || "LAUNDRYKU").toUpperCase(),
		y + 14,
		14,
		"bold",
		C.primary,
	);
	y += 20;

	if (settings.address) {
		const lines = pdf.splitTextToSize(settings.address, CONTENT_W - 20);
		setFont(pdf, 6.5, "normal", C.mid);
		pdf.text(lines, WIDTH / 2, y + 8, { align: "center" });
		y += lines.length > 1 ? lines.length * 7 : 10;
	}

	y += 8;
	drawLine(pdf, y, true);
	y += 10;

	// ── Order Info ──────────────────────────────────────────────────
	rowLR(
		pdf,
		"Order ID",
		`#${order.id.toString().padStart(4, "0")}`,
		y,
		{ size: 6, style: "bold", color: C.light },
		{ size: 9, style: "bold", color: C.black },
	);
	y += 12;

	rowLR(pdf, "Tanggal", formatDate(order.createdAt), y, {
		size: 6,
		style: "bold",
		color: C.light,
	}, { size: 8, style: "normal", color: C.dark });
	y += 12;

	rowLR(pdf, "Pelanggan", order.customerName, y, {
		size: 6,
		style: "bold",
		color: C.light,
	}, { size: 8, style: "bold", color: C.black });
	y += 14;

	drawLine(pdf, y, true);
	y += 10;

	// ── Items Table ─────────────────────────────────────────────────
	setFont(pdf, 6, "bold", C.light);
	pdf.text("LAYANAN", MARGIN, y);
	pdf.text("TOTAL", WIDTH - MARGIN, y, { align: "right" });
	y += 4;
	drawLine(pdf, y);
	y += 8;

	for (const item of order.items) {
		setFont(pdf, 7.5, "bold", C.black);
		pdf.text(item.serviceName, MARGIN, y);
		pdf.text(formatRupiah(item.subtotal), WIDTH - MARGIN, y, {
			align: "right",
		});
		y += 9;

		setFont(pdf, 6.5, "normal", C.mid);
		pdf.text(
			`${item.quantity} x ${formatRupiah(item.unitPrice)}`,
			MARGIN,
			y,
		);
		y += 10;
	}

	y += 4;

	// ── Totals Box ──────────────────────────────────────────────────
	const boxH = 32 + (order.paymentMethod ? 12 : 0);
	pdf.setFillColor(C.bg);
	pdf.setDrawColor(C.faint);
	pdf.roundedRect(MARGIN, y, CONTENT_W, boxH, 4, 4, "FD");
	y += 12;

	setFont(pdf, 7, "normal", C.mid);
	pdf.text("Total Tagihan", MARGIN + 8, y);
	setFont(pdf, 10, "bold", C.primary);
	pdf.text(formatRupiah(order.nominal), WIDTH - MARGIN - 8, y, {
		align: "right",
	});
	y += 12;

	setFont(pdf, 6.5, "normal", C.mid);
	pdf.text("Status Bayar", MARGIN + 8, y);
	setFont(pdf, 7, "bold", payColor);
	pdf.text(order.paymentStatus.replace("_", " "), WIDTH - MARGIN - 8, y, {
		align: "right",
	});
	y += 12;

	if (order.paymentMethod) {
		setFont(pdf, 6.5, "normal", C.mid);
		pdf.text("Metode", MARGIN + 8, y);
		setFont(pdf, 7, "bold", C.dark);
		pdf.text(order.paymentMethod, WIDTH - MARGIN - 8, y, {
			align: "right",
		});
		y += 12;
	}

	y += 6;

	// ── Estimated Completion ────────────────────────────────────────
	if (order.estimatedCompletion) {
		const estH = 28;
		pdf.setDrawColor(C.primary);
		pdf.setLineWidth(0.8);
		pdf.roundedRect(MARGIN, y, CONTENT_W, estH, 6, 6, "S");
		y += 10;
		centerText(pdf, "ESTIMASI SELESAI", y, 6, "bold", C.primary);
		y += 10;
		centerText(
			pdf,
			formatDate(order.estimatedCompletion),
			y,
			8,
			"bold",
			C.primary,
		);
		y += 14;
	}

	y += 6;

	// ── Footer ──────────────────────────────────────────────────────
	centerText(pdf, "DIGITAL RECEIPT", y, 5.5, "bold", C.light);
	y += 12;
	centerText(pdf, "Terima Kasih", y, 7, "bold", C.light);
	y += 10;

	// Decorative dots
	const dotR = 1.2;
	const dotsCount = 12;
	const totalDotsW = dotsCount * dotR * 2 + (dotsCount - 1) * 3;
	let dotX = (WIDTH - totalDotsW) / 2 + dotR;
	pdf.setFillColor(C.faint);
	for (let i = 0; i < dotsCount; i++) {
		pdf.circle(dotX, y, dotR, "F");
		dotX += dotR * 2 + 3;
	}
}
