declare global {
  interface Window {
    $: (s: string) => NodeListOf<Element>;
    $1: (s: string) => Element | null;
  }
}

export {};
