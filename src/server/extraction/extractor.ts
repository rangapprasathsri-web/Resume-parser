export interface ExtractedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'unknown';
  hasTextLayer: boolean;
  error?: string;
}

/**
 * Extracts plain text from TXT, Markdown, or raw string data
 */
export function extractTextFromRaw(content: string, fileName: string = 'document.txt'): ExtractedDocument {
  const clean = content.replace(/\r\n/g, '\n').trim();
  return {
    text: clean,
    wordCount: clean.split(/\s+/).filter(Boolean).length,
    fileName,
    fileType: fileName.endsWith('.md') ? 'txt' : 'txt',
    hasTextLayer: clean.length > 0,
  };
}

/**
 * Extracts text from DOCX buffer using mammoth
 */
export async function extractTextFromDocx(buffer: Buffer, fileName: string = 'resume.docx'): Promise<ExtractedDocument> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').replace(/\r\n/g, '\n').trim();
    
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      fileName,
      fileType: 'docx',
      hasTextLayer: text.length > 20,
      error: text.length <= 20 ? 'Document appears empty or contains no extractable text.' : undefined,
    };
  } catch (err: any) {
    return {
      text: '',
      wordCount: 0,
      fileName,
      fileType: 'docx',
      hasTextLayer: false,
      error: `Failed to extract text from DOCX: ${err.message || 'Corrupt or unsupported DOCX format'}`,
    };
  }
}

/**
 * Extracts text from PDF buffer using pdfjs-dist
 */
export async function extractTextFromPdf(buffer: Buffer, fileName: string = 'resume.pdf'): Promise<ExtractedDocument> {
  try {
    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .join(' ');
      pageTexts.push(pageStrings);
    }

    const fullText = pageTexts.join('\n\n').replace(/\r\n/g, '\n').trim();
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const hasTextLayer = wordCount > 15;

    return {
      text: fullText,
      pageCount: numPages,
      wordCount,
      fileName,
      fileType: 'pdf',
      hasTextLayer,
      error: hasTextLayer
        ? undefined
        : 'This PDF does not contain an extractable text layer (scanned or image-only PDF). Please upload a text-based PDF or DOCX.',
    };
  } catch (err: any) {
    return {
      text: '',
      wordCount: 0,
      fileName,
      fileType: 'pdf',
      hasTextLayer: false,
      error: `Failed to extract text from PDF: ${err.message || 'Corrupted PDF file or unsupported structure.'}`,
    };
  }
}

/**
 * Universal file text extractor based on file extension / buffer
 */
export async function extractDocumentText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
    return extractTextFromPdf(buffer, fileName);
  }

  if (
    lowerName.endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractTextFromDocx(buffer, fileName);
  }

  // Treat as plain text
  try {
    const rawText = buffer.toString('utf-8');
    return extractTextFromRaw(rawText, fileName);
  } catch (e: any) {
    return {
      text: '',
      wordCount: 0,
      fileName,
      fileType: 'unknown',
      hasTextLayer: false,
      error: `Unsupported file encoding: ${e.message}`,
    };
  }
}
