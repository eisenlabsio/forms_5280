const normalizeRegexString = (raw) => {
    if (typeof raw !== 'string') {
        return '';
    }

    return raw.trim().replace(/\\\\/g, '\\');
};

export { normalizeRegexString };
