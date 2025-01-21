const countriesToCurrency: Record<string, string> = {
    IN: 'INR',
    IND: 'INR',

    GB: 'GBP',
    GBR: 'GBP',
    GG: 'GBP',
    GGY: 'GBP',
    GS: 'GBP',
    SGS: 'GBP',
    IM: 'GBP',
    IMN: 'GBP',
    JE: 'GBP',
    JEY: 'GBP',

    AD: 'EUR',
    AND: 'EUR',
    AT: 'EUR',
    AUT: 'EUR',
    AX: 'EUR',
    ALA: 'EUR',
    BE: 'EUR',
    BEL: 'EUR',
    BL: 'EUR',
    BLM: 'EUR',
    CY: 'EUR',
    DE: 'EUR',
    EE: 'EUR',
    ES: 'EUR',
    EU: 'EUR',
    FI: 'EUR',
    FR: 'EUR',
    GF: 'EUR',
    GP: 'EUR',
    GR: 'EUR',
    HR: 'EUR',
    IE: 'EUR',
    IT: 'EUR',
    LT: 'EUR',
    LU: 'EUR',
    LV: 'EUR',
    MC: 'EUR',
    ME: 'EUR',
    MF: 'EUR',
    MQ: 'EUR',
    MT: 'EUR',
    NL: 'EUR',
    PM: 'EUR',
    PT: 'EUR',
    RE: 'EUR',
    SI: 'EUR',
    SK: 'EUR',
    SM: 'EUR',
    TF: 'EUR',
    VA: 'EUR',
    XK: 'EUR',
    YT: 'EUR',
};

const languagesToCurrency: Record<string, string> = {
    hi: 'INR',
    gu: 'INR',
    te: 'INR',
    kn: 'INR',
    ta: 'INR',
    mr: 'INR',

    de: 'EUR',
    el: 'EUR',
    et: 'EUR',
    fi: 'EUR',
    fr: 'EUR',
    ga: 'EUR',
    hr: 'EUR',
    it: 'EUR',
    lb: 'EUR',
    lv: 'EUR',
    lt: 'EUR',
    mt: 'EUR',
    nl: 'EUR',
    se: 'EUR',
    sk: 'EUR',
    sl: 'EUR',
    sv: 'EUR',
    tr: 'EUR',
};

/**
 * Returns the currency for the given locale. The currency
 * is chosen based on the locale's country, if present. If not
 * present, it is chosen based on the language. USD is used
 * as a fallback.
 * @param locale The locale to get the currency for.
 * @returns The currency for the given locale.
 */
export function getCurrency(locale: string | undefined): string {
    if (!locale) {
        return 'USD';
    }

    const country = getCountry(locale);
    if (countriesToCurrency[country]) {
        return countriesToCurrency[country];
    }

    const language = locale.split('-')[0].toLowerCase();
    if (languagesToCurrency[language]) {
        return languagesToCurrency[language];
    }

    return 'USD';
}

/**
 * Returns the country of the given locale, if it is present.
 * @param locale The locale to get the country from.
 * @returns The country, if present, in all uppercase.
 */
function getCountry(locale: string): string {
    let components = locale.split('_');
    if (components.length === 2) {
        return components[1].toUpperCase();
    }

    components = locale.split('-');
    if (components.length === 2) {
        return components[1].toUpperCase();
    }

    return '';
}
