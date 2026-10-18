export const CUSTOM_THEME_MODE = 'custom';
export const CUSTOM_THEME_CONFIG_KEY = 'VRCX_customTheme';

/**
 * Every knob of the custom theme preset. Stored as a single JSON object so the
 * whole preset travels together and unknown keys can be dropped on load.
 */
export const CUSTOM_THEME_DEFAULTS = {
    baseColor: '#12161f',
    accentColor: '#6ea8fe',
    backgroundImage: '',
    backgroundEnabled: true,
    backgroundOpacity: 55,
    backgroundBlur: 0,
    backgroundFit: 'cover',
    surfaceOpacity: 62,
    surfaceBlur: 12,
    overlayOpacity: 82,
    overlayBlur: 18,
    radius: 8
};

export const CUSTOM_THEME_IMAGE_FILTER =
    'Image Files (*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.avif)|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.avif|All files (*.*)|*.*';

export const CUSTOM_THEME_BACKGROUND_FITS = ['cover', 'contain', 'fill', 'tile', 'center'];

export const CUSTOM_THEME_IMAGE_BLUR_PRESETS = [
    { key: 'off', value: 0 },
    { key: 'soft', value: 6 },
    { key: 'medium', value: 14 },
    { key: 'strong', value: 26 }
];

export const CUSTOM_THEME_SURFACE_BLUR_PRESETS = [
    { key: 'off', value: 0 },
    { key: 'soft', value: 10 },
    { key: 'medium', value: 20 },
    { key: 'strong', value: 34 }
];

export const CUSTOM_THEME_OVERLAY_BLUR_PRESETS = [
    { key: 'off', value: 0 },
    { key: 'soft', value: 8 },
    { key: 'medium', value: 18 },
    { key: 'strong', value: 30 }
];

export const CUSTOM_THEME_BASE_SWATCHES = ['#0b0d10', '#12161f', '#141a17', '#17151c', '#1a1614', '#1b1b1f'];

export const CUSTOM_THEME_ACCENT_SWATCHES = ['#6ea8fe', '#8fd8e8', '#7dd3a8', '#f0a868', '#c9a0ff', '#f0728f'];

export const CUSTOM_THEME_RECIPES = [
    {
        key: 'glass',
        values: {
            baseColor: '#12161f',
            accentColor: '#6ea8fe',
            backgroundEnabled: true,
            backgroundOpacity: 72,
            backgroundBlur: 16,
            surfaceOpacity: 52,
            surfaceBlur: 20,
            overlayOpacity: 72,
            overlayBlur: 26,
            radius: 12
        }
    },
    {
        key: 'night',
        values: {
            baseColor: '#141a17',
            accentColor: '#7dd3a8',
            backgroundEnabled: true,
            backgroundOpacity: 40,
            backgroundBlur: 0,
            surfaceOpacity: 72,
            surfaceBlur: 0,
            overlayOpacity: 90,
            overlayBlur: 8,
            radius: 6
        }
    },
    {
        key: 'warm',
        values: {
            baseColor: '#1a1614',
            accentColor: '#f0a868',
            backgroundEnabled: true,
            backgroundOpacity: 34,
            backgroundBlur: 0,
            surfaceOpacity: 78,
            surfaceBlur: 8,
            overlayOpacity: 90,
            overlayBlur: 10,
            radius: 8
        }
    },
    {
        key: 'ink',
        values: {
            baseColor: '#0b0d10',
            accentColor: '#8fd8e8',
            backgroundEnabled: false,
            backgroundOpacity: 0,
            backgroundBlur: 0,
            surfaceOpacity: 92,
            surfaceBlur: 0,
            overlayOpacity: 96,
            overlayBlur: 0,
            radius: 4
        }
    }
];
