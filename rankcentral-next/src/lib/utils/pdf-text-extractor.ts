/**
 * Frontend PDF text extraction utility using pdfjs-dist
 * Extracts text directly in the browser, eliminating the need for base64 transmission
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  success: boolean;
  text: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    charCount: number;
    avgWordsPerPage: number;
  };
  error?: string;
}

/**
 * Extract text from a PDF file directly in the browser
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    console.log(`🔍 Extracting text from PDF: ${file.name}`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from all pages
    const textContent: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContentObj = await page.getTextContent();
        
        // Combine text items into a single string
        const pageText = textContentObj.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          textContent.push(pageText);
        }
        
        console.log(`📃 Extracted text from page ${pageNum}: ${pageText.length} characters`);
      } catch (pageError) {
        console.warn(`⚠️ Error extracting text from page ${pageNum}:`, pageError);
        continue;
      }
    }
    
    // Combine all text and clean it
    const rawText = textContent.join('\n\n');
    const cleanedText = cleanTextForLLM(rawText);
    
    // Calculate metadata
    const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = cleanedText.length;
    const avgWordsPerPage = wordCount / pdf.numPages;
    
    // Validate extraction quality
    if (wordCount < 10) {
      throw new Error(`Extracted text is too short (${wordCount} words) - may be a scanned PDF requiring OCR`);
    }
    
    console.log(`✅ Successfully extracted ${charCount} characters, ${wordCount} words from ${file.name}`);
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        pageCount: pdf.numPages,
        wordCount,
        charCount,
        avgWordsPerPage
      }
    };
    
  } catch (error) {
    console.error(`❌ Error extracting text from PDF ${file.name}:`, error);
    return {
      success: false,
      text: '',
      metadata: {
        pageCount: 0,
        wordCount: 0,
        charCount: 0,
        avgWordsPerPage: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean and normalize extracted PDF text for optimal LLM processing
 */
function cleanTextForLLM(rawText: string): string {
  let cleaned = rawText;
  
  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\r\n/g, '\n');   // Windows line endings
  cleaned = cleaned.replace(/\r/g, '\n');     // Mac line endings
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double
  
  // Remove page numbers and headers/footers
  cleaned = cleaned.replace(/^Page \d+.*$/gm, '');
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');
  
  // Clean up spacing
  cleaned = cleaned.replace(/[ \t]+$/gm, ''); // Trailing spaces
  cleaned = cleaned.replace(/^[ \t]{1,2}/gm, ''); // Leading spaces
  
  // Fix word boundaries
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // camelCase -> camel Case
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2'); // sentence.Next -> sentence. Next
  
  // Remove orphaned punctuation
  cleaned = cleaned.replace(/^\s*[.,:;!?]\s*$/gm, '');
  
  // Normalize multiple spaces
  cleaned = cleaned.replace(/  +/g, ' ');
  
  // Final cleanup
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}