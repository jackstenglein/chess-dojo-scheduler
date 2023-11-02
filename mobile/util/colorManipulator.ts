interface InternalColor {
    type: string;
    values: Array<number | string>;
    colorSpace?: string;
}

/**
 * Returns a number whose value is limited to the given range.
 * @param value The value to be clamped
 * @param min The lower boundary of the output range
 * @param max The upper boundary of the output range
 * @returns A number in the range [min, max]
 */
function clamp(value: number, min = 0, max = 1): number {
    if (process.env.NODE_ENV !== 'production') {
        if (value < min || value > max) {
            console.error(
                `MUI: The value provided ${value} is out of range [${min}, ${max}].`
            );
        }
    }

    return Math.min(Math.max(min, value), max);
}

/**
 * Sets the absolute transparency of a color.
 * Any existing alpha values are overwritten.
 * @param  color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @param value - value to set the alpha channel to in the range 0 - 1
 * @returns A CSS color string. Hex input values are returned as rgb
 */
export function alpha(color: string, value: number): string {
    let internalColor = decomposeColor(color);
    value = clamp(value);

    if (internalColor.type === 'rgb' || internalColor.type === 'hsl') {
        internalColor.type += 'a';
    }
    if (internalColor.type === 'color') {
        internalColor.values[3] = `/${value}`;
    } else {
        internalColor.values[3] = value;
    }

    return recomposeColor(internalColor);
}

/**
 * Converts a color from CSS hex format to CSS rgb format.
 * @param  color - Hex color, i.e. #nnn or #nnnnnn
 * @returns A CSS rgb color string
 */
export function hexToRgb(color: string): string {
    color = color.slice(1);

    const re = new RegExp(`.{1,${color.length >= 6 ? 2 : 1}}`, 'g');
    let colors: RegExpMatchArray | null | string[] = color.match(re);

    if (colors && colors[0].length === 1) {
        colors = colors.map((n) => n + n);
    }

    return colors
        ? `rgb${colors.length === 4 ? 'a' : ''}(${colors
              .map((n, index) => {
                  return index < 3
                      ? parseInt(n, 16)
                      : Math.round((parseInt(n, 16) / 255) * 1000) / 1000;
              })
              .join(', ')})`
        : '';
}

/**
 * Returns an object with the type and values of a color.
 *
 * Note: Does not support rgb % values.
 * @param  color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @returns  An InternalColor object.
 */
export function decomposeColor(color: string | InternalColor): InternalColor {
    // Idempotent
    if (typeof color !== 'string') {
        return color;
    }

    if (color.charAt(0) === '#') {
        return decomposeColor(hexToRgb(color));
    }

    const marker = color.indexOf('(');
    const type = color.substring(0, marker);

    if (['rgb', 'rgba', 'hsl', 'hsla', 'color'].indexOf(type) === -1) {
        throw new Error(
            `Unsupported color: ${color}. The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().`
        );
    }

    let values: string | string[] | number[] = color.substring(
        marker + 1,
        color.length - 1
    );
    let colorSpace;

    if (type === 'color') {
        values = values.split(' ');
        colorSpace = values.shift();
        if (values.length === 4 && values[3].charAt(0) === '/') {
            values[3] = values[3].slice(1);
        }
        if (
            ['srgb', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec-2020'].indexOf(
                colorSpace || ''
            ) === -1
        ) {
            throw new Error(
                `color space: ${colorSpace}. The following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.`
            );
        }
    } else {
        values = values.split(',');
    }
    values = values.map((value) => parseFloat(value));

    return { type, values, colorSpace };
}

/**
 * Converts a color object with type and values to a string.
 * @param  color - Decomposed color
 * @param  color.type - One of: 'rgb', 'rgba', 'hsl', 'hsla', 'color'
 * @param color.values - [n,n,n] or [n,n,n,n]
 * @returns A CSS color string
 */
export function recomposeColor(color: InternalColor): string {
    const { type, colorSpace } = color;
    let values: string | Array<string | number> = color.values;

    if (type.indexOf('rgb') !== -1) {
        // Only convert the first 3 values to int (i.e. not alpha)
        values = values.map((n, i) => (i < 3 ? parseInt(n as string, 10) : n));
    } else if (type.indexOf('hsl') !== -1) {
        values[1] = `${values[1]}%`;
        values[2] = `${values[2]}%`;
    }
    if (type.indexOf('color') !== -1) {
        values = `${colorSpace} ${values.join(' ')}`;
    } else {
        values = `${values.join(', ')}`;
    }

    return `${type}(${values})`;
}
