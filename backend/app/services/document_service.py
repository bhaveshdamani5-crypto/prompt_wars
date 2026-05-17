"""
LexGuard AI — Document Upload & Extraction Service
====================================================
Orchestrates the full upload pipeline:
  1. Validate file type & size
  2. Save file to uploads/ directory with unique name
  3. Extract raw text (pdfplumber for PDFs, plain read for TXT)
  4. Send to Gemini API for simplified, point-wise text extraction
  5. For images (PNG/JPG), use Gemini Vision directly
  6. Return clean extracted text ready for clause segmentation
"""

import os
import logging
import uuid
from typing import Optional, Tuple

from .gemini_client import generate_text, get_model, is_configured

from ..utils.parser import (
    validate_file_extension,
    validate_file_size,
    validate_content_type,
    generate_safe_filename,
    extract_raw_text,
)

logger = logging.getLogger("LexGuard-AI.DocumentService")

# ──────────────────────────────────────────────
# Gemini Configuration
# ──────────────────────────────────────────────

UPLOADS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

_gemini_configured: bool = is_configured()


def _get_model():
    """Return the configured Gemini model instance."""
    return get_model()


# ──────────────────────────────────────────────
# Gemini-Powered Simplified Text Extraction
# ──────────────────────────────────────────────

def _simplify_text_with_gemini(raw_text: str, filename: str) -> str:
    """
    Send raw extracted text to Gemini and get back a simplified,
    point-wise breakdown of every single line/clause in the document.

    This transforms dense legalese into understandable plain English.
    """
    if not _gemini_configured:
        logger.warning("Gemini not configured. Returning raw text as-is.")
        return raw_text

    try:
        model = _get_model()

        prompt: str = f"""You are LexGuard AI, an expert legal document simplifier.

You have been given the raw extracted text of a legal contract file named "{filename}".

Your task is to produce a **complete, simplified, point-wise breakdown** of the ENTIRE document.

CRITICAL RULES:
1. Cover EVERY SINGLE LINE and clause — do NOT skip anything, no matter how minor.
2. Keep the original section numbering and headings intact.
3. For EACH clause or paragraph, provide:
   - The original section number/heading (if present)
   - A clear, plain-English explanation of what that clause ACTUALLY means
   - Any specific numbers, dates, amounts, or deadlines mentioned
4. Use bullet points (•) for sub-items within each section.
5. If a clause has legal jargon, translate it into simple everyday language.
6. Highlight any obligations, rights, restrictions, or penalties.
7. Keep it structured and organized — NOT a wall of text.
8. Do NOT add your own opinions or risk assessments — just simplify the language.
9. Preserve the COMPLETE content — every definition, every schedule, every exhibit.

FORMAT your output as:

## [Section Number]. [Section Title]
• [Simplified point 1]
• [Simplified point 2]
• Key numbers/dates: [specific values]

RAW CONTRACT TEXT:
{raw_text}
"""

        simplified: str = generate_text(prompt, temperature=0.1, max_output_tokens=12000)
        logger.info(f"Gemini simplified text extraction complete for '{filename}' ({len(simplified)} chars).")
        return simplified

    except Exception as e:
        logger.error(f"Gemini text simplification failed: {e}. Returning raw text.")
        return raw_text


def _extract_text_from_image_with_gemini(file_bytes: bytes, filename: str, mime_type: str) -> str:
    """
    Use Gemini Vision to extract and simplify text from scanned images (PNG/JPG/JPEG).
    Replaces OCR entirely — Gemini reads the image directly.
    """
    if not _gemini_configured:
        raise ValueError(
            "Gemini API key is required to process image files. "
            "Please configure GEMINI_API_KEY in your .env file."
        )

    try:
        model = _get_model()

        # Prepare multimodal content (image + prompt)
        image_part = {
            "mime_type": mime_type,
            "data": file_bytes,
        }

        prompt: str = f"""You are LexGuard AI, an expert legal document reader.

This image is a scanned legal contract page from the file "{filename}".

Your task:
1. Extract ALL text visible in the image — every single word, number, and symbol.
2. Preserve the original structure: headings, numbered sections, paragraphs, tables.
3. After extracting, provide a point-wise simplified explanation of each clause.
4. Format the output clearly with section numbers and bullet points.
5. Do NOT skip any content — capture everything visible in the image.
6. If text is unclear or partially visible, note it as [partially illegible].

Provide the full extracted and simplified text below:
"""

        response = model.generate_content([prompt, image_part])
        extracted: str = response.text.strip()
        logger.info(f"Gemini Vision extraction complete for image '{filename}' ({len(extracted)} chars).")
        return extracted

    except Exception as e:
        logger.error(f"Gemini Vision extraction failed for '{filename}': {e}")
        raise ValueError(f"Failed to extract text from image: {str(e)}")


# ──────────────────────────────────────────────
# File Storage
# ──────────────────────────────────────────────

def _save_file_to_disk(file_bytes: bytes, safe_filename: str) -> str:
    """
    Save the uploaded file to the uploads/ directory.
    Creates the directory if it doesn't exist.
    Returns the full saved file path.
    """
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file_path: str = os.path.join(UPLOADS_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    logger.info(f"File saved to disk: {file_path}")
    return file_path


# ──────────────────────────────────────────────
# Master Upload Pipeline
# ──────────────────────────────────────────────

def process_document_upload(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> dict:
    """
    Full document upload processing pipeline.

    Steps:
      1. Validate file extension
      2. Validate file size
      3. Cross-check content type
      4. Generate a unique safe filename
      5. Save file to uploads/
      6. Extract raw text (pdfplumber for PDF, decode for TXT)
      7. Send to Gemini for simplified point-wise extraction
      8. For images, use Gemini Vision directly

    Returns a dictionary with all document metadata and extracted text.
    """
    logger.info(f"Processing upload: '{filename}' (content_type={content_type})")

    # Step 1-3: Validation
    ext: str = validate_file_extension(filename)
    size_kb: float = validate_file_size(file_bytes, filename)
    validate_content_type(content_type, filename)

    # Step 4: Generate unique filename
    safe_filename: str = generate_safe_filename(filename)
    document_id: str = str(uuid.uuid4())

    # Step 5: Save to disk
    saved_path: str = _save_file_to_disk(file_bytes, safe_filename)

    # Step 6-7: Extract text based on file type
    page_count: Optional[int] = None
    simplified_text: str = ""

    if ext in {".png", ".jpg", ".jpeg"}:
        # Images go directly to Gemini Vision — no local extraction
        mime_map: dict = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
        mime_type: str = mime_map.get(ext, "image/png")
        simplified_text = _extract_text_from_image_with_gemini(file_bytes, filename, mime_type)

    else:
        # PDF, DOCX or TXT: local extraction first
        raw_text: str
        raw_text, page_count = extract_raw_text(file_bytes, filename)

        if not raw_text.strip():
            raise ValueError(
                "The document appears to be empty or contains only scanned images "
                "without a text layer. Please upload a text-based PDF or use an image format."
            )

        # Bypass slow pre-simplification, send raw text directly for single-pass segmentation
        simplified_text = raw_text

    logger.info(
        f"Upload pipeline complete for '{filename}': "
        f"doc_id={document_id}, size={size_kb}KB, pages={page_count}, "
        f"extracted_chars={len(simplified_text)}"
    )

    return {
        "document_id": document_id,
        "filename": filename,
        "safe_filename": safe_filename,
        "saved_path": saved_path,
        "file_size_kb": size_kb,
        "file_type": ext,
        "page_count": page_count,
        "extracted_text": simplified_text,
    }
