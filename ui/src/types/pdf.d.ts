declare module 'pdfjs-dist' {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  export interface TextContent {
    items: TextItem[];
  }

  export interface TextItem {
    str: string;
  }

  export interface PDFDocumentLoadingTask<T> {
    promise: Promise<T>;
  }

  export function getDocument(source: { data: ArrayBuffer }): PDFDocumentLoadingTask<PDFDocumentProxy>;

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export const version: string;
} 