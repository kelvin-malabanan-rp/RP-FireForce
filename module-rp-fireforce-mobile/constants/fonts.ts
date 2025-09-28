export const FONT_FAMILY = {
    // Poppins variants - matching your exact file names
    POPPINS_THIN: 'Poppins-Thin',
    POPPINS_EXTRA_LIGHT: 'Poppins-ExtraLight',
    POPPINS_LIGHT: 'Poppins-Light',
    POPPINS_REGULAR: 'Poppins-Regular',
    POPPINS_MEDIUM: 'Poppins-Medium',
    POPPINS_SEMI_BOLD: 'Poppins-SemiBold',
    POPPINS_BOLD: 'Poppins-Bold',
    POPPINS_EXTRA_BOLD: 'Poppins-ExtraBold',
    POPPINS_BLACK: 'Poppins-Black',

    // Italic variants - matching your exact file names
    POPPINS_THIN_ITALIC: 'Poppins-ThinItalic',
    POPPINS_EXTRA_LIGHT_ITALIC: 'Poppins-ExtraLightItalic',
    POPPINS_LIGHT_ITALIC: 'Poppins-LightItalic',
    POPPINS_REGULAR_ITALIC: 'Poppins-Italic',
    POPPINS_MEDIUM_ITALIC: 'Poppins-MediumItalic',
    POPPINS_SEMI_BOLD_ITALIC: 'Poppins-SemiBoldItalic',
    POPPINS_BOLD_ITALIC: 'Poppins-BoldItalic',
    POPPINS_EXTRA_BOLD_ITALIC: 'Poppins-ExtraBoldItalic',
    POPPINS_BLACK_ITALIC: 'Poppins-BlackItalic',

    // Default fallbacks
    DEFAULT: 'System',
} as const;

// Type for autocomplete support
export type FontFamily = typeof FONT_FAMILY[keyof typeof FONT_FAMILY];