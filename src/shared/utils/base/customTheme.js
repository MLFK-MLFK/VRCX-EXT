import { CUSTOM_THEME_DEFAULTS } from '../../constants';

const IMAGE_MIME_BY_EXTENSION = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    avif: 'image/avif'
};

const BACKGROUND_FIT_STYLES = {
    cover: { size: 'cover', repeat: 'no-repeat' },
    contain: { size: 'contain', repeat: 'no-repeat' },
    fill: { size: '100% 100%', repeat: 'no-repeat' },
    tile: { size: 'auto', repeat: 'repeat' },
    center: { size: 'auto', repeat: 'no-repeat' }
};

const CUSTOM_THEME_PROPERTY_NAMES = [
    '--custom-base',
    '--custom-accent',
    '--custom-accent-foreground',
    '--custom-surface-alpha',
    '--custom-surface-blur',
    '--custom-overlay-alpha',
    '--custom-overlay-blur',
    '--custom-image',
    '--custom-image-opacity',
    '--custom-image-blur',
    '--custom-image-size',
    '--custom-image-position',
    '--custom-image-repeat',
    '--custom-radius'
];

// The background image is exposed as a Blob URL so several megabytes of base64 never end up in the inline style.
let backgroundObjectUrl = null;
let backgroundImagePath = null;
let pendingApplyToken = 0;

/**
 * @param {string} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeHexColor(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }
    const normalized = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(normalized)) {
        return normalized;
    }
    if (/^#[0-9a-f]{3}$/.test(normalized)) {
        return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return fallback;
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
function clampNumber(value, min, max, fallback) {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(parsed)));
}

/**
 * Relative luminance, used to pick a readable foreground for the accent colour.
 *
 * @param {string} hex
 * @returns {number}
 */
function relativeLuminance(hex) {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const [r, g, b] = channels.map((channel) =>
        channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {string} accentColor
 * @returns {string}
 */
export function getCustomThemeAccentForeground(accentColor) {
    const accent = normalizeHexColor(accentColor, CUSTOM_THEME_DEFAULTS.accentColor);
    // 0.179 is where black and white contrast equally against a colour (WCAG relative luminance).
    return relativeLuminance(accent) > 0.179 ? '#0b0d10' : '#ffffff';
}

/**
 * Merges the defaults and repairs invalid fields so the render layer always gets usable values.
 *
 * @param {object} [values]
 * @returns {typeof CUSTOM_THEME_DEFAULTS}
 */
export function normalizeCustomTheme(values) {
    const source = values && typeof values === 'object' ? values : {};
    const merged = { ...CUSTOM_THEME_DEFAULTS, ...source };
    return {
        baseColor: normalizeHexColor(merged.baseColor, CUSTOM_THEME_DEFAULTS.baseColor),
        accentColor: normalizeHexColor(merged.accentColor, CUSTOM_THEME_DEFAULTS.accentColor),
        backgroundImage: typeof merged.backgroundImage === 'string' ? merged.backgroundImage : '',
        backgroundEnabled: merged.backgroundEnabled !== false,
        backgroundOpacity: clampNumber(merged.backgroundOpacity, 0, 100, CUSTOM_THEME_DEFAULTS.backgroundOpacity),
        backgroundBlur: clampNumber(merged.backgroundBlur, 0, 60, CUSTOM_THEME_DEFAULTS.backgroundBlur),
        backgroundFit: BACKGROUND_FIT_STYLES[merged.backgroundFit]
            ? merged.backgroundFit
            : CUSTOM_THEME_DEFAULTS.backgroundFit,
        surfaceOpacity: clampNumber(merged.surfaceOpacity, 0, 100, CUSTOM_THEME_DEFAULTS.surfaceOpacity),
        surfaceBlur: clampNumber(merged.surfaceBlur, 0, 60, CUSTOM_THEME_DEFAULTS.surfaceBlur),
        overlayOpacity: clampNumber(merged.overlayOpacity, 0, 100, CUSTOM_THEME_DEFAULTS.overlayOpacity),
        overlayBlur: clampNumber(merged.overlayBlur, 0, 60, CUSTOM_THEME_DEFAULTS.overlayBlur),
        radius: clampNumber(merged.radius, 0, 24, CUSTOM_THEME_DEFAULTS.radius)
    };
}

/**
 * @param {string} path
 * @returns {string}
 */
function resolveImageMime(path) {
    const extension = String(path).split('.').pop()?.toLowerCase() ?? '';
    return IMAGE_MIME_BY_EXTENSION[extension] ?? 'image/png';
}

/**
 * @param {string} base64
 * @param {string} mime
 * @returns {Blob}
 */
function base64ToBlob(base64, mime) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mime });
}

function releaseBackgroundObjectUrl() {
    if (backgroundObjectUrl) {
        URL.revokeObjectURL(backgroundObjectUrl);
    }
    backgroundObjectUrl = null;
    backgroundImagePath = null;
}

/**
 * Writes the values onto <html> as inline custom properties; custom.css only reads them under [data-theme='custom'].
 *
 * @param {typeof CUSTOM_THEME_DEFAULTS} settings
 */
function applyCustomThemeProperties(settings) {
    const style = document.documentElement.style;
    const fit = BACKGROUND_FIT_STYLES[settings.backgroundFit];
    style.setProperty('--custom-base', settings.baseColor);
    style.setProperty('--custom-accent', settings.accentColor);
    style.setProperty('--custom-accent-foreground', getCustomThemeAccentForeground(settings.accentColor));
    style.setProperty('--custom-surface-alpha', String(settings.surfaceOpacity));
    style.setProperty('--custom-surface-blur', `${settings.surfaceBlur}px`);
    style.setProperty('--custom-overlay-alpha', String(settings.overlayOpacity));
    style.setProperty('--custom-overlay-blur', `${settings.overlayBlur}px`);
    style.setProperty('--custom-image-opacity', String(settings.backgroundOpacity / 100));
    style.setProperty('--custom-image-blur', `${settings.backgroundBlur}px`);
    style.setProperty('--custom-image-size', fit.size);
    style.setProperty('--custom-image-position', 'center');
    style.setProperty('--custom-image-repeat', fit.repeat);
    style.setProperty('--custom-radius', `${settings.radius}px`);
}

/**
 * Applies the custom appearance values. The background image loads asynchronously; asking for the same
 * image again reuses the cached Blob URL instead of reading the file a second time.
 *
 * @param {object} [values]
 * @returns {Promise<void>}
 */
export async function applyCustomTheme(values) {
    const settings = normalizeCustomTheme(values);
    const token = (pendingApplyToken += 1);

    applyCustomThemeProperties(settings);

    if (!settings.backgroundEnabled || !settings.backgroundImage) {
        releaseBackgroundObjectUrl();
        document.documentElement.style.setProperty('--custom-image', 'none');
        return;
    }

    if (backgroundObjectUrl && backgroundImagePath === settings.backgroundImage) {
        document.documentElement.style.setProperty('--custom-image', `url("${backgroundObjectUrl}")`);
        return;
    }

    try {
        const base64 = await AppApi.GetFileBase64(settings.backgroundImage);
        if (token !== pendingApplyToken) {
            return;
        }
        if (!base64) {
            releaseBackgroundObjectUrl();
            document.documentElement.style.setProperty('--custom-image', 'none');
            return;
        }
        const objectUrl = URL.createObjectURL(base64ToBlob(base64, resolveImageMime(settings.backgroundImage)));
        releaseBackgroundObjectUrl();
        backgroundObjectUrl = objectUrl;
        backgroundImagePath = settings.backgroundImage;
        document.documentElement.style.setProperty('--custom-image', `url("${objectUrl}")`);
    } catch (error) {
        if (token !== pendingApplyToken) {
            return;
        }
        console.error('Failed to load custom theme background image:', error);
        releaseBackgroundObjectUrl();
        document.documentElement.style.setProperty('--custom-image', 'none');
    }
}

/**
 * Removes every custom property and releases the background image; called when switching to another theme.
 */
export function clearCustomTheme() {
    pendingApplyToken += 1;
    releaseBackgroundObjectUrl();
    const style = document.documentElement.style;
    for (const name of CUSTOM_THEME_PROPERTY_NAMES) {
        style.removeProperty(name);
    }
}
