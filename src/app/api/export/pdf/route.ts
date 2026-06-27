import { NextRequest, NextResponse } from 'next/server';
import { chromium } from '@playwright/test';

export async function POST(req: NextRequest) {
  try {
    const { html, css } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          ${css || ''}
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .resume-container {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${html}
        </div>
      </body>
      </html>
    `;

    // Wait until network is idle to ensure web fonts and images load
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    // Ensure fonts are loaded
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="export.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
