const pdfParse = require('pdf-parse');

/**
 * Extracts raw text and metadata from a PDF buffer.
 *
 * @param {Buffer} buffer - In-memory PDF buffer from multer
 * @returns {Promise<{ text: string, numPages: number, wordCount: number }>}
 */
async function extractPdfText(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid PDF buffer provided for extraction.');
  }

  try {
    // Convert Buffer to pure Uint8Array to ensure consistent byte alignment across environments
    const uint8Data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const data = await pdfParse(uint8Data);
    const rawText = data.text || '';

    // Normalize text: strip null characters, unify line endings, trim excessive whitespaces
    const cleanedText = rawText
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const numPages = data.numpages || 1;

    if (wordCount === 0) {
      throw new Error('No readable text found in PDF. The document may be scanned or image-based without embedded text.');
    }

    return {
      text: cleanedText,
      numPages,
      wordCount
    };
  } catch (err) {
    if (err.message && err.message.includes('No readable text')) {
      throw err;
    }
    throw new Error(`PDF parsing failed: ${err.message || 'Corrupted or unsupported PDF format.'}`);
  }
}

module.exports = {
  extractPdfText
};
