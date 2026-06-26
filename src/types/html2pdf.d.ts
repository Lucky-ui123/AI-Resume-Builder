declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; [key: string]: unknown };
    jsPDF?: { unit?: string; format?: string | number[]; orientation?: 'portrait' | 'landscape' | 'p' | 'l' };
    pagebreak?: { mode?: string | string[]; before?: string; after?: string; avoid?: string };
  }

  interface Html2PdfWorker {
    from(element: HTMLElement | string): this;
    set(options: Html2PdfOptions): this;
    save(): Promise<void>;
    output(type: string, options?: unknown): Promise<unknown>;
    outputPdf(type?: string): Promise<unknown>;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfWorker;

  export default html2pdf;
}
