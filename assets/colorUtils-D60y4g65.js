/**
 * Converts a hexadecimal color string to RGB values
 * @param {string} hex - Hexadecimal color string (with or without #)
 * @returns {{r: number, g: number, b: number}} RGB color object
 * @throws {Error} When hex color is invalid
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') {
    throw new Error('Invalid hex color: must be a non-empty string');
  }
  
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid hex color format: ${hex}`);
  }
  
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

/**
 * Converts RGB color values to XYZ color space
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {{x: number, y: number, z: number}} XYZ color object
 */
function rgbToXyz(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return { x, y, z };
}

function xyzToLab(x, y, z) {
  x /= 95.047;
  y /= 100.0;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return { l, a, b };
}

function rgbToLab(rgb) {
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

function deltaE76(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
  );
}

/**
 * Compares two hex colors and returns feedback with similarity percentage
 * @param {string} userColor - User's guessed color in hex format
 * @param {string} correctColor - The correct color in hex format
 * @returns {string} Feedback message with percentage similarity
 * @throws {Error} When color formats are invalid
 */
export function compareColors(userColor, correctColor) {
  try {
    const userLab = rgbToLab(hexToRgb(userColor));
    const correctLab = rgbToLab(hexToRgb(correctColor));

    const deltaE = deltaE76(userLab, correctLab);
    const percentage = Math.max(0, 100 - (deltaE / 2.3) * 100); // Normalize to 0-100%
    let feedbackText = `A tipp ${percentage.toFixed(2)}%-ban helyes.`;

    if (percentage > 90) {
      feedbackText += ' Nagyon közel vagy!';
    } else if (percentage > 70) {
      feedbackText += ' Jó úton haladsz!';
    } else if (percentage > 50) {
      feedbackText += ' Nem rossz, de még dolgoznod kell rajta.';
    } else {
      feedbackText += ' Eléggé eltértél a helyes színtől.';
    }

    return feedbackText;
  } catch (error) {
    console.error('Color comparison failed:', error);
    return 'Hiba történt a színek összehasonlítása során.';
  }
}

export function adjustHexColor(hex, component, value) {
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  switch (component) {
    case 'r':
      r = Math.min(255, Math.max(0, r + value));
      break;
    case 'g':
      g = Math.min(255, Math.max(0, g + value));
      break;
    case 'b':
      b = Math.min(255, Math.max(0, b + value));
      break;
  }

  return [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function isValidHexColor(hex) {
  return /^#?[0-9A-F]{6}$/i.test(hex);
}

export function generateCloseColor(generatedColor) {
  const offset = Math.floor(Math.random() * 20) - 10; // Small deviation +/- 10
  let r = Math.min(
    255,
    Math.max(0, parseInt(generatedColor.substring(1, 3), 16) + offset)
  );
  let g = Math.min(
    255,
    Math.max(0, parseInt(generatedColor.substring(3, 5), 16) + offset)
  );
  let b = Math.min(
    255,
    Math.max(0, parseInt(generatedColor.substring(5, 7), 16) + offset)
  );

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Calculate color difference using Delta E (CIE76)
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color  
 * @returns {number} Delta E value (0 = identical, higher = more different)
 * @throws {Error} When color formats are invalid
 */
export function calculateColorDifference(color1, color2) {
  try {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const lab1 = rgbToLab(rgb1);
    const lab2 = rgbToLab(rgb2);
    
    return deltaE76(lab1, lab2);
  } catch (error) {
    console.error('Color difference calculation failed:', error);
    return 100; // Return high difference on error
  }
}
