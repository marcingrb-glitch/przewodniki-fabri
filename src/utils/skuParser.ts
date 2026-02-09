import { ParsedSKU } from "@/types";

/**
 * Parse SKU string into structured components.
 * Format: S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF
 */
export function parseSKU(sku: string): ParsedSKU {
  const parts = sku.trim().toUpperCase().split("-");

  const result: ParsedSKU = {
    series: "",
    fabric: { code: "", color: "" },
    seat: { base: "", type: "" },
    side: { code: "", finish: "" },
    backrest: { code: "", finish: "" },
    chest: "",
    automat: "",
    extras: [],
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

    // Seat: SD2NA, SD01N, SD04D, SD1N, SD03A
    // Format: SD + digits + type letters (N, ND, W, or empty) + optional finish (A-D)
    const seatMatch = part.match(/^SD(\d+)(N[DB]?|W)?([A-D])?$/);
    if (seatMatch) {
      const num = seatMatch[1].padStart(2, "0");
      const type = seatMatch[2] || "";
      const finish = seatMatch[3] || "";
      result.seat = { base: `SD${num}`, type, finish: finish || undefined };
      continue;
    }

    // Side/Boczek: B8C, B1A
    const sideMatch = part.match(/^B(\d+(?:S|W)?)([A-C])$/);
    if (sideMatch) {
      const rawCode = sideMatch[1];
      let code = rawCode.replace(/([SW])$/, (m) => m.toLowerCase());
      // B6 bez sufiksu -> automatycznie B6s
      if (code === "6") code = "6s";
      result.side = { code: `B${code}`, finish: sideMatch[2] };
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
      result.chest = part;
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

    // Pillow: P1, P2
    if (/^P[12]$/.test(part)) {
      result.pillow = part;
      continue;
    }

    // Jaski: J1, J2
    if (/^J[12]$/.test(part)) {
      result.jaski = part;
      continue;
    }

    // Walek: W1
    if (part === "W1") {
      result.walek = part;
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
