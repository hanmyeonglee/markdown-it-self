declare module 'markdown-it-texmath' {
  import MarkdownIt from 'markdown-it';
  
  interface TexMathOptions {
    engine?: unknown;
    delimiters?: 'dollars' | 'brackets' | 'gitlab' | 'julia' | 'kramdown';
    katexOptions?: Record<string, unknown>;
  }
  
  function texmath(md: MarkdownIt, options?: TexMathOptions): void;
  
  export = texmath;
}
