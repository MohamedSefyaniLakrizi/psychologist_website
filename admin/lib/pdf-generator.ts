import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface InvoiceData {
  id: string;
  amount: number;
  createdAt: string | Date;
  dueDate?: string | Date | null;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  appointment?: {
    startTime: string | Date;
  } | null;
}

export function generateInvoicePdf(invoice: InvoiceData): Buffer {
  // Invoice.amount is stored as total (price including 20% TVA).
  const total = Number(invoice.amount);
  const totalHT = +(total / 1.2).toFixed(2); // price without TVA
  const totalTVA = +(total - totalHT).toFixed(2);

  const appointmentDate = invoice.appointment?.startTime
    ? format(new Date(invoice.appointment.startTime), "PPP 'à' HH:mm", {
        locale: fr,
      })
    : "-";
  const createdAt = format(new Date(invoice.createdAt), "dd/MM/yyyy", {
    locale: fr,
  });
  // Create PDF
  const doc = new jsPDF();
  doc.setFont("times");

  // HEADER - Company Info (Top Left) and Invoice Details (Top Right)
  // Company Logo and Address (Left)
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  doc.text("VOTRE SOCIÉTÉ", 20, 20);
  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text("123 Rue de l'Exemple", 20, 28);
  doc.text("20000 Casablanca, Maroc", 20, 34);
  doc.text("Tél: +212 5 22 XX XX XX", 20, 40);
  doc.text("Email: contact@votresociete.ma", 20, 46);

  // Invoice Title and Details (Right)
  doc.setFontSize(20);
  doc.setFont("times", "bold");
  doc.text("FACTURE", 150, 20);
  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text(`N°: ${invoice.id.slice(-8).toUpperCase()}`, 150, 30);
  doc.text(`Date: ${createdAt}`, 150, 36);
  doc.text(`Lieu: Casablanca`, 150, 42);
  doc.text(`Commande N°: CMD-${invoice.id.slice(-6)}`, 150, 48);

  // CLIENT INFORMATION (Left Side)
  doc.setFontSize(10);
  doc.setFont("times", "bold");
  doc.text("FACTURER À:", 20, 65);
  doc.setFont("times", "normal");
  doc.text(
    `Nom: ${invoice.client.firstName} ${invoice.client.lastName}`,
    20,
    75
  );
  doc.text(`CIN: [À compléter]`, 20, 81);
  doc.text(`Adresse: [À compléter]`, 20, 87);
  doc.text(`Téléphone: [À compléter]`, 20, 93);

  // Additional Information
  doc.setFontSize(9);
  doc.setFont("times", "italic");
  doc.text("Garantie: 12 mois sur les prestations", 20, 105);

  // MAIN TABLE
  const tableY = 120;
  const tableHeaders = [
    { text: "Description", x: 20, width: 60 },
    { text: "Quantité", x: 80, width: 20 },
    { text: "Prix unit. HT", x: 100, width: 25 },
    { text: "% TVA", x: 125, width: 15 },
    { text: "Total TVA", x: 140, width: 25 },
    { text: "Total TTC", x: 165, width: 25 },
  ];

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableY - 8, 170, 12, "F");
  doc.setFontSize(9);
  doc.setFont("times", "bold");
  tableHeaders.forEach((header) => {
    doc.text(header.text, header.x, tableY - 2);
  });

  // Table Content
  const rowY = tableY + 10;
  doc.setFont("times", "normal");
  const description = `Consultation/Prestation - ${appointmentDate}`;

  // Split description into multiple lines if needed
  doc.setFontSize(8); // Smaller font for description
  const maxWidth = 55; // Max width for description column
  const lines = doc.splitTextToSize(description, maxWidth);

  // Draw description lines
  lines.forEach((line: string, index: number) => {
    doc.text(line, 20, rowY + index * 4);
  });

  // Calculate the height needed for description
  const descriptionHeight = lines.length * 4;
  const finalRowY = rowY + Math.max(0, descriptionHeight - 4);

  // Other table content aligned to the FIRST line (same baseline as first description line)
  doc.setFontSize(9);
  doc.text("1", 85, rowY); // Align with first line of description
  doc.text(`${totalHT.toFixed(2)}`, 105, rowY);
  doc.text("20%", 130, rowY);
  doc.text(`${totalTVA.toFixed(2)}`, 145, rowY);
  doc.text(`${total.toFixed(2)}`, 170, rowY);

  // TOTAL IN WORDS (Left Side) - positioned after table content
  const totalWordsY = finalRowY + 20;
  const totalInWords = `Arrêté la présente facture à la somme de: ${total.toFixed(2)} Dirhams`;
  doc.setFontSize(9);
  doc.setFont("times", "italic");
  doc.text(totalInWords, 20, totalWordsY);

  // SUMMARY BOX (Right Side) - positioned after table content
  const summaryX = 130;
  const summaryY = finalRowY + 10;

  // Summary box background
  doc.setFillColor(250, 250, 250);
  doc.rect(summaryX, summaryY, 60, 35, "F");
  doc.setLineWidth(0.5);
  doc.rect(summaryX, summaryY, 60, 35);

  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text("Total HT:", summaryX + 5, summaryY + 8);
  doc.text(`${totalHT.toFixed(2)} Dh`, summaryX + 35, summaryY + 8);
  doc.text("Total TVA:", summaryX + 5, summaryY + 16);
  doc.text(`${totalTVA.toFixed(2)} Dh`, summaryX + 35, summaryY + 16);

  doc.setFont("times", "bold");
  doc.text("Total TTC:", summaryX + 5, summaryY + 28);
  doc.text(`${total.toFixed(2)} Dh`, summaryX + 35, summaryY + 28);

  // PAYMENT STATUS - positioned after total in words
  doc.setFontSize(9);
  doc.setFont("times", "normal");
  doc.text(`Réglée le: ___________  Mode: ___________`, 20, totalWordsY + 15);

  // FOOTER (3 columns)
  const footerY = 250;

  // Column 1: Registered Office
  doc.setFontSize(7);
  doc.setFont("times", "bold");
  doc.text("SIÈGE SOCIAL:", 20, footerY);
  doc.setFont("times", "normal");
  doc.text("123 Rue de l'Exemple", 20, footerY + 5);
  doc.text("20000 Casablanca, Maroc", 20, footerY + 10);
  doc.text("Tél: +212 5 22 XX XX XX", 20, footerY + 15);

  // Column 2: Company Identifiers
  doc.setFont("times", "bold");
  doc.text("IDENTIFIANTS:", 80, footerY);
  doc.setFont("times", "normal");
  doc.text("ICE: 000000000000000", 80, footerY + 5);
  doc.text("IF: 00000000", 80, footerY + 10);
  doc.text("RC: 000000", 80, footerY + 15);
  doc.text("CNSS: 0000000", 80, footerY + 20);

  // Column 3: Banking Details
  doc.setFont("times", "bold");
  doc.text("COORDONNÉES BANCAIRES:", 140, footerY);
  doc.setFont("times", "normal");
  doc.text("Banque: [Nom de la banque]", 140, footerY + 5);
  doc.text("IBAN: MA64 XXXX XXXX XXXX", 140, footerY + 10);
  doc.text("XXXX XXXX XX", 140, footerY + 15);
  doc.text("SWIFT: XXXXXXXX", 140, footerY + 20);

  // Return PDF as Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

export function generateInvoiceFilename(invoiceId: string): string {
  return `facture-${invoiceId.slice(-8)}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
}
