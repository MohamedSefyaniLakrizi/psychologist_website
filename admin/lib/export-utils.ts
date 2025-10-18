import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export const exportToPDF = async (
  htmlContent: string,
  title: string
): Promise<string> => {
  if (!htmlContent || !title) {
    throw new Error("Aucun contenu à exporter");
  }

  try {
    // Try text-based PDF first for selectable text
    return await exportTextPDF(htmlContent, title);
  } catch (error) {
    console.error("Text PDF failed, falling back to image PDF:", error);
    // Fallback to image-based PDF if text PDF fails
    return await exportImagePDF(htmlContent, title);
  }
};

const exportTextPDF = async (htmlContent: string, title: string) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Parse HTML content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const addText = (
    text: string,
    fontSize: number = 12,
    isBold: boolean = false
  ) => {
    if (!text.trim()) return;

    // Set font style
    const fontStyle = isBold ? "bold" : "normal";
    pdf.setFont("helvetica", fontStyle);
    pdf.setFontSize(fontSize);

    // Split text into lines that fit the page width
    const lines = pdf.splitTextToSize(text, maxWidth);

    // Check if we need a new page
    const lineHeight = fontSize * 0.5;
    const textHeight = lines.length * lineHeight;

    if (currentY + textHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    // Add text to PDF
    pdf.text(lines, margin, currentY);
    currentY += textHeight + 5; // Add some spacing
  };

  const addListItem = (
    text: string,
    isOrdered: boolean = false,
    index: number = 0
  ) => {
    const bullet = isOrdered ? `${index + 1}. ` : "• ";
    addText(bullet + text, 12, false, false);
  };

  // Process elements
  const processElement = (element: Element, listIndex: number = 0): number => {
    const currentIndex = listIndex;

    if (element.tagName === "P") {
      addText(element.textContent || "", 12);
    } else if (element.tagName?.match(/^H[1-6]$/)) {
      const level = parseInt(element.tagName.charAt(1));
      const fontSize = Math.max(14, 20 - level * 1);
      addText(element.textContent || "", fontSize, true);
    } else if (element.tagName === "UL") {
      const listItems = element.querySelectorAll("li");
      listItems.forEach((li) => {
        addListItem(li.textContent || "", false);
      });
    } else if (element.tagName === "OL") {
      const listItems = element.querySelectorAll("li");
      listItems.forEach((li, index) => {
        addListItem(li.textContent || "", true, index);
      });
    } else if (element.tagName === "BLOCKQUOTE") {
      addText(element.textContent || "", 12, false, true);
    } else if (element.textContent?.trim()) {
      addText(element.textContent, 12);
    }

    return currentIndex;
  };

  // Process all child elements
  Array.from(tempDiv.children).forEach((child) => {
    processElement(child);
  });

  // If no content was added, add a message
  if (currentY === margin) {
    addText("Aucun contenu à exporter", 12);
  }

  // Save the PDF
  const fileName = `${title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}_note.pdf`;
  pdf.save(fileName);
  return "PDF exporté avec succès (texte sélectionnable)";
};

const exportImagePDF = async (htmlContent: string, title: string) => {
  // Create a temporary div to render just the raw HTML content with better styling
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Apply comprehensive styling for proper PDF rendering
  tempDiv.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 800px;
    background: #ffffff;
    color: #000000;
    font-family: Arial, sans-serif;
    padding: 20px;
    line-height: 1.6;
    font-size: 14px;
  `;

  // Fix list styling specifically
  const lists = tempDiv.querySelectorAll("ul, ol");
  lists.forEach((list) => {
    (list as HTMLElement).style.cssText = `
      margin: 16px 0;
      padding-left: 20px;
    `;
  });

  const listItems = tempDiv.querySelectorAll("li");
  listItems.forEach((li) => {
    (li as HTMLElement).style.cssText = `
      margin: 8px 0;
      line-height: 1.5;
      display: list-item;
    `;
  });

  // Fix paragraph styling
  const paragraphs = tempDiv.querySelectorAll("p");
  paragraphs.forEach((p) => {
    (p as HTMLElement).style.cssText = `
      margin: 12px 0;
      line-height: 1.6;
    `;
  });

  // Fix heading styling
  const headings = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    const size = Math.max(16, 24 - level * 2);
    (heading as HTMLElement).style.cssText = `
      margin: 20px 0 12px 0;
      line-height: 1.3;
      font-weight: bold;
      font-size: ${size}px;
    `;
  });

  // Fix blockquote styling
  const blockquotes = tempDiv.querySelectorAll("blockquote");
  blockquotes.forEach((bq) => {
    (bq as HTMLElement).style.cssText = `
      margin: 16px 0;
      padding: 12px 20px;
      border-left: 4px solid #ccc;
      font-style: italic;
      background: #f9f9f9;
    `;
  });

  document.body.appendChild(tempDiv);

  // Generate canvas with better options for text rendering
  const canvas = await html2canvas(tempDiv, {
    scale: 3, // Higher scale for better text quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    removeContainer: true,
    logging: false,
    imageTimeout: 0,
    ignoreElements: (element) => {
      const style = window.getComputedStyle(element);
      return style.display === "none" || style.visibility === "hidden";
    },
    onclone: (clonedDoc) => {
      // Ensure proper font rendering
      const style = clonedDoc.createElement("style");
      style.textContent = `
        * {
          font-family: Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ul, ol {
          list-style-position: inside;
          margin: 16px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          line-height: 1.5;
          display: list-item;
        }
        ul li {
          list-style-type: disc;
        }
        ol li {
          list-style-type: decimal;
        }
        p {
          margin: 12px 0;
          line-height: 1.6;
        }
      `;
      clonedDoc.head.appendChild(style);

      // Remove problematic stylesheets
      const styleSheets = clonedDoc.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i] as CSSStyleSheet;
          if (sheet.href && sheet.href.includes("/_next/static/")) {
            const linkElement = clonedDoc.querySelector(
              `link[href="${sheet.href}"]`
            );
            if (linkElement) {
              linkElement.remove();
            }
          }
        } catch (e) {
          // Ignore cross-origin stylesheets
          console.warn("Could not access stylesheet:", e);
        }
      }
    },
  });

  // Remove temporary div
  document.body.removeChild(tempDiv);

  // Create PDF with better quality settings
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm (corrected)
  const margin = 10; // Add margins
  const contentWidth = imgWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  let heightLeft = imgHeight;

  const imgData = canvas.toDataURL("image/png", 1.0); // Max quality
  let position = margin; // Start with margin

  // Add image to PDF with margins
  pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
  heightLeft -= contentHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= contentHeight;
  }

  // Save the PDF
  const fileName = `${title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}_note.pdf`;
  pdf.save(fileName);
  return "PDF exporté avec succès (image)";
};

export const exportToDOCX = async (
  htmlContent: string,
  title: string
): Promise<string> => {
  if (!htmlContent || !title) {
    throw new Error("Aucun contenu à exporter");
  }

  // Parse HTML content to create proper DOCX structure
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const sections = [];

  // Process each element in the HTML content
  const processElement = (element: Element): Paragraph[] => {
    const paragraphs: Paragraph[] = [];

    if (element.tagName === "P") {
      const textRuns: TextRun[] = [];
      const text = element.textContent || "";

      if (text.trim()) {
        textRuns.push(
          new TextRun({
            text: text,
          })
        );
      }

      if (textRuns.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 200 },
          })
        );
      }
    } else if (element.tagName?.match(/^H[1-6]$/)) {
      const text = element.textContent || "";
      if (text.trim()) {
        const level = parseInt(element.tagName.charAt(1));
        const headingLevels = [
          HeadingLevel.HEADING_1,
          HeadingLevel.HEADING_2,
          HeadingLevel.HEADING_3,
          HeadingLevel.HEADING_4,
          HeadingLevel.HEADING_5,
          HeadingLevel.HEADING_6,
        ];
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: Math.max(24, 32 - level * 2), // Size based on heading level
              }),
            ],
            heading: headingLevels[level - 1] || HeadingLevel.HEADING_6,
            spacing: { after: 300 },
          })
        );
      }
    } else if (element.tagName === "UL" || element.tagName === "OL") {
      // Handle lists
      const listItems = element.querySelectorAll("li");
      listItems.forEach((li) => {
        const text = li.textContent || "";
        if (text.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${text}`, // Simple bullet for now
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      });
    } else if (element.tagName === "BLOCKQUOTE") {
      const text = element.textContent || "";
      if (text.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    } else {
      // For other elements, extract text content
      const text = element.textContent || "";
      if (text.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    return paragraphs;
  };

  // Process all child elements
  Array.from(tempDiv.children).forEach((child) => {
    const childParagraphs = processElement(child);
    sections.push(...childParagraphs);
  });

  // If no structured content found, fall back to plain text
  if (sections.length === 0) {
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const contentParagraphs = plainText.split("\n").filter((p) => p.trim());

    contentParagraphs.forEach((paragraphText) => {
      if (paragraphText.trim()) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraphText,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
  }

  // If still no content, add empty content
  if (sections.length === 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "",
          }),
        ],
      })
    );
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Generate and save the document
  const blob = await Packer.toBlob(doc);
  const fileName = `${title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}_note.docx`;
  saveAs(blob, fileName);
  return "DOCX exporté avec succès";
};
