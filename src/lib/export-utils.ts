

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
        // Ignore CORS errors for external stylesheets
      }
    }
  } catch (e) {
    // Ignore stylesheet reading errors
  }
  return cssText;
};

/**
 * PDF Generator
 * Creates a hidden iframe, injects the resume HTML and styles, and triggers native print.
 * This guarantees offline support and avoids 50MB Vercel serverless limits.
 */
export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Could not find the resume preview element.');

  const cssText = getGlobalCSS();
  const htmlContent = element.innerHTML;

  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create print frame');
  }

  // Inject content and styles
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${filename}</title>
      <style>
        ${cssText}
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        .resume-container { width: 100% !important; box-shadow: none !important; }
      </style>
    </head>
    <body>
      <div class="resume-container">
        ${htmlContent}
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for images and fonts to load, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Cleanup after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

