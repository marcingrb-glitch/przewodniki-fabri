import { ParsedSKU } from "@/types";

/**
 * Parse SKU string into structured components.
 * Format: S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF
 */
// LEGACY: Side exceptions moved to DB table `side_exceptions`
// parseSKU() now accepts optional sideExceptions parameter from DB

export function parseSKU(sku: string, sideExceptions?: Record<string, string>): ParsedSKU {
  const parts = sku.trim().toUpperCase().split("-");

  const result: ParsedSKU = {
    series: "",
    fabric: { code: "", color: "" },
    seat: { rawSegment: "" },
    side: { code: "", finish: "" },
    backrest: { code: "", finish: "" },
    chest: "",
    automat: "",
    extras: [],
    sideException: undefined,
  };

  for (const part of parts) {
    // Series: S1, S2, N1...
    if (/^(S|N)\d+$/.test(part)) {
      result.series = part;
      continue;
    }

    // Fabric: T3D, T10A, T11B...
    const fabricMatch = part.match(/^T(\d+)([A-F])$/);
    if (fabricMatch) {
      result.fabric = { code: `T${fabricMatch[1]}`, color: fabricMatch[2] };
      continue;
    }

    // Seat: captures raw segment for later resolution by the decoder
    // Supports both S1 format (SD01N, SD02NA, SD01ND) and S2 format (SD1, SD1D, SD4B)
    // The decoder will resolve which part is code vs finish using the database
    const seatMatch = part.match(/^(SD\d+(?:N[DB]?|W|D)?)([A-D])?$/);
    if (seatMatch && !result.seat.rawSegment) {
      result.seat = { rawSegment: seatMatch[1], finish: seatMatch[2] || undefined };
      continue;
    }

    // Side/Boczek: B8C, B1A — with exception pre-processing (from DB)
    if (sideExceptions && sideExceptions[part]) {
      const original = part;
      const mapped = sideExceptions[part];
      result.sideException = `Zamieniono ${original} → ${mapped} (wyjątek Shopify)`;
      console.log(`[SKU Parser] Side exception: ${original} → ${mapped}`);
      // Parse the mapped value instead
      const mappedMatch = mapped.match(/^B(\d+(?:S|W)?)([A-D])?$/);
      if (mappedMatch) {
        const rawCode = mappedMatch[1];
        let code = rawCode.replace(/([SW])$/, (m) => m.toLowerCase());
        if (code === "6") code = "6s";
        result.side = { code: `B${code}`, finish: mappedMatch[2] || "" };
      }
      continue;
    }

    const sideMatch = part.match(/^B(\d+(?:S|W)?)([A-C])?$/);
    if (sideMatch) {
      const rawCode = sideMatch[1];
      let code = rawCode.replace(/([SW])$/, (m) => m.toLowerCase());
      if (code === "6") code = "6s";
      result.side = { code: `B${code}`, finish: sideMatch[2] || "" };
      continue;
    }

    // Backrest: OP62A, OP68C
    const backrestMatch = part.match(/^OP(\d{2})([A-C])$/);
    if (backrestMatch) {
      result.backrest = { code: `OP${backrestMatch[1]}`, finish: backrestMatch[2] };
      continue;
    }

    // Chest: SK15, SK17, SK23
    if (/^SK\d{2}$/.test(part)) {
      result.chest = part === "SK22" ? "SK23" : part;
      continue;
    }

    // Automat: AT1, AT2
    if (/^AT[12]$/.test(part)) {
      result.automat = part;
      continue;
    }

    // Legs: N1A, N5B, N2 (without color)
    // Must NOT match series format (S1, N1 at start without following letter)
    // Legs appear after AT and start with N followed by digit and optional color letter
    const legMatch = part.match(/^N(\d)([A-C])?$/);
    if (legMatch && result.automat) {
      result.legs = { code: `N${legMatch[1]}`, color: legMatch[2] };
      continue;
    }

    // Pillow: P1, P2, P3A, P1C etc.
    const pillowMatch = part.match(/^(P\d+)([A-D])?$/);
    if (pillowMatch && !result.pillow) {
      result.pillow = { code: pillowMatch[1], finish: pillowMatch[2] || undefined };
      continue;
    }

    // Jaski: J1, J2, J1A, J3B etc.
    const jaskiMatch = part.match(/^(J\d+)([A-D])?$/);
    if (jaskiMatch && !result.jaski) {
      result.jaski = { code: jaskiMatch[1], finish: jaskiMatch[2] || undefined };
      continue;
    }

    // Walek: W1, W1A, W2B etc.
    const walekMatch = part.match(/^(W\d+)([A-D])?$/);
    if (walekMatch && !result.walek) {
      result.walek = { code: walekMatch[1], finish: walekMatch[2] || undefined };
      continue;
    }

    // Extras: PF, PFO, FT
    if (["PF", "PFO", "FT"].includes(part)) {
      result.extras.push(part);
      continue;
    }
  }

  return result;
}
