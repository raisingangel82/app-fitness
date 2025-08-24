// src/types.ts
export type ColorShade = '400' | '700' | '800';

export interface ColorPalette {
  name: string;
  base: string;
  shades: {
    [key in ColorShade]: {
      hex: string;
      bgClass: string;
      textClass: string;
      ringClass: string;
    };
  };
}