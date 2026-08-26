declare module 'pagedjs' {
  export class Previewer {
    preview(content: HTMLElement | string, stylesheets: string[], renderTo: HTMLElement): Promise<void>;
  }
}
interface Window {
  PagedConfig?: any;
  PagedPolyfill?: any;
}
