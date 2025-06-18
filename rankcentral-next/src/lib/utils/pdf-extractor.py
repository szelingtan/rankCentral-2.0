#!/usr/bin/env python3
"""
PDF text extraction utility using PyPDF2.
Clean and simple text extraction for document comparison.
"""

import sys
import json
import base64
import io
from typing import Dict, Any
import PyPDF2


def extract_text_from_pdf(pdf_base64: str) -> Dict[str, Any]:
    """
    Extract text from a base64-encoded PDF using PyPDF2.
    
    Args:
        pdf_base64: Base64 encoded PDF content
        
    Returns:
        Dictionary containing extracted text and metadata
    """
    try:
        # Decode base64 to bytes
        pdf_bytes = base64.b64decode(pdf_base64)
        
        # Create PDF reader
        pdf_stream = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_stream)
        
        # Extract text from all pages
        text_content = []
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text.strip():
                    text_content.append(page_text)
            except Exception as e:
                print(f"Warning: Error extracting text from page {page_num + 1}: {e}", file=sys.stderr)
                continue
        
        # Combine all text
        full_text = "\n\n".join(text_content)
        
        # Clean up the text
        cleaned_text = clean_text_for_llm(full_text)
        
        # Validate extraction quality
        word_count = len(cleaned_text.split())
        page_count = len(reader.pages)
        
        return {
            "success": True,
            "text": cleaned_text,
            "metadata": {
                "page_count": page_count,
                "word_count": word_count,
                "char_count": len(cleaned_text),
                "avg_words_per_page": word_count / page_count if page_count > 0 else 0
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "metadata": {}
        }


def clean_text_for_llm(raw_text: str) -> str:
    """
    Clean and normalize extracted PDF text for optimal LLM processing.
    
    Args:
        raw_text: Raw text extracted from PDF
        
    Returns:
        Cleaned and normalized text
    """
    import re
    
    # Basic cleanup
    text = raw_text
    
    # Normalize whitespace
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space
    text = re.sub(r'\r\n', '\n', text)   # Windows line endings
    text = re.sub(r'\r', '\n', text)     # Mac line endings
    text = re.sub(r'\n{3,}', '\n\n', text)  # Multiple newlines to double
    
    # Remove page numbers and headers/footers
    text = re.sub(r'^Page \d+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
    
    # Clean up spacing
    text = re.sub(r'[ \t]+$', '', text, flags=re.MULTILINE)  # Trailing spaces
    text = re.sub(r'^[ \t]{1,2}', '', text, flags=re.MULTILINE)  # Leading spaces
    
    # Fix word boundaries
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # camelCase -> camel Case
    text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)  # sentence.Next -> sentence. Next
    
    # Remove orphaned punctuation
    text = re.sub(r'^\s*[.,:;!?]\s*$', '', text, flags=re.MULTILINE)
    
    # Normalize multiple spaces
    text = re.sub(r'  +', ' ', text)
    
    # Final cleanup
    text = text.strip()
    
    return text


def main():
    """Main function to handle command line usage."""
    if len(sys.argv) != 2:
        print("Usage: python pdf-extractor.py <base64_pdf_content>", file=sys.stderr)
        sys.exit(1)
    
    pdf_base64 = sys.argv[1]
    
    # Handle data URI format
    if pdf_base64.startswith('data:application/pdf;base64,'):
        pdf_base64 = pdf_base64.split(',', 1)[1]
    
    result = extract_text_from_pdf(pdf_base64)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()