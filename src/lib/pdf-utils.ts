import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function generateReceiptPDF(orderId: number, element: HTMLElement | null) {
	if (!element) {
		console.error("Receipt element not found!");
		throw new Error("Element not found");
	}

	try {
		const canvas = await html2canvas(element, {
			scale: 2, // Higher quality
			useCORS: true,
			logging: false,
			backgroundColor: "#ffffff",
		});

		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF({
			orientation: "portrait",
			unit: "px",
			format: [canvas.width / 2, canvas.height / 2],
		});
		pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
		pdf.save(`Struk-Laundry-${orderId.toString().padStart(4, "0")}.pdf`);
		console.log("PDF generated successfully");
		return true;
	} catch (error) {
		console.error("html2canvas or jspdf error:", error);
		throw error;
	}
}
