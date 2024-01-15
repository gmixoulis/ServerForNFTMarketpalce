function encryptText(text) {
  if (typeof text !== "string") {
    return text;
  }

  if (/^0x[0-9a-fA-F]{6,}$/.test(text)) {
    // Encrypt hexadecimal address
    const prefix = text.slice(0, 6);
    const suffix = text.slice(-4);
    return `${prefix}***${suffix}`;
  } else {
    // Encrypt name or other text
    const nameParts = text.trim().split(" ");
    const encryptedParts = nameParts.map((part) => {
      if (part.length <= 3) {
        const encryptedChars = "*".repeat(part.length);
        return encryptedChars;
      } else if (part.length <= 6) {
        const firstThreeChars = part.slice(0, 2);
        const encryptedChars = "*".repeat(part.length - 3);
        return firstThreeChars + encryptedChars;
      } else {
        const firstThreeChars = part.slice(0, 4);
        const encryptedChars = "*".repeat(part.length - 4);
        return firstThreeChars + encryptedChars;
      }
    });

    return encryptedParts.join(" ");
  }
}

module.exports = { encryptText };
