const parseScaleValue = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    const raw = String(value).trim();
    if (!raw) {
        return null;
    }
    const isPercent = raw.includes('%');
    const numeric = parseFloat(raw.replace('%', ''));
    if (Number.isNaN(numeric)) {
        return null;
    }
    const scale = isPercent ? numeric / 100 : numeric;
    return scale > 0 ? scale : null;
};

export const extractFontScaleConfig = (source = {}) => {
    return {
        base: parseScaleValue(source.font_scale),
        ios: parseScaleValue(source.font_scale_ios),
        android: parseScaleValue(source.font_scale_android),
        desktop: parseScaleValue(source.font_scale_desktop),
    };
};

const getDeviceCategory = (userAgent) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        return 'ios';
    }
    if (ua.includes('android')) {
        return 'android';
    }
    return 'desktop';
};

export const resolveFontScale = (config, userAgent) => {
    if (!config) {
        return 1;
    }
    const category = getDeviceCategory(userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
    const deviceScale = config[category];
    if (deviceScale) {
        return deviceScale;
    }
    if (config.base) {
        return config.base;
    }
    return 1;
};
