

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
      } catch {
        // Ignore CORS errors for external stylesheets
      }
    }
  } catch {
    // Ignore stylesheet reading errors
  }
  return cssText;
};

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Could not find the resume preview element.');

  const cssText = getGlobalCSS();
  const htmlContent = element.innerHTML;

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html: htmlContent, css: cssText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

