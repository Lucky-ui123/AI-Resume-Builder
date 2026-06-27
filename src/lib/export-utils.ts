import { saveAs } from 'file-saver';

/**
 * Extracts the active CSS text from the document.
 */
const getGlobalCSS = () => {
  let cssText = '';
  try {
    for (const styleSheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(styleSheet.cssRules || [])) {
          cssText += rule.cssText + '\n';
        }
      } catch (e) {
        console.warn('Could not read cssRules from a stylesheet (likely CORS issue)', e);
      }
    }
  } catch (e) {
    console.warn('Error reading stylesheets', e);
  }
  return cssText;
};

/**
 * PDF Generator
 * Uses a Playwright Server-Side API route to generate a true, high-resolution vector PDF with embedded fonts.
 */
export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Could not find the resume preview element.');

  const cssText = getGlobalCSS();
  
  const clone = element.cloneNode(true) as HTMLElement;
  const htmlContent = clone.innerHTML;

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: htmlContent, css: cssText }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  const blob = await response.blob();
  saveAs(blob, filename);
};

