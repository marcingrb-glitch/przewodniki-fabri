import { DecodedSKU } from "@/types";
import { formatFoamsDetailed } from "@/utils/foamHelpers";

/**
 * Resolve a field path to a display value from a DecodedSKU object.
 * Used by both the decoding PDF generator and the guide generator.
 */
export function resolveDecodedField(field: string, decoded: DecodedSKU): string {
  switch (field) {
    case "fabric.code": return decoded.fabric.code;
    case "fabric.name": return decoded.fabric.name;
    case "fabric.color": return `${decoded.fabric.color} - ${decoded.fabric.colorName}`;
    case "fabric.group": return `${decoded.fabric.group}`;

    case "seat.code": return decoded.seat.code;
    case "seat.finish_name": return decoded.seat.finishName;
    case "seat.code_finish": return `${decoded.seat.code} (${decoded.seat.finishName})`;
    case "seat.type": return decoded.seat.type || "-";
    case "seat.frame": return decoded.seat.frame || "-";
    case "seat.frameModification": return decoded.seat.frameModification || "-";
    case "seat.springType": return decoded.seat.springType || "-";
    case "seat.front": return decoded.seat.front || "-";
    case "seat.midStrip_yn": return decoded.seat.midStrip ? "TAK" : "NIE";
    case "seat.foams_summary":
    case "seat.foamsList": {
      const lines = formatFoamsDetailed(decoded.seat.foams);
      return lines.length > 0 ? lines.join("\n") : decoded.seat.foam || "-";
    }

    case "backrest.code": return decoded.backrest.code;
    case "backrest.finish_name": return decoded.backrest.finishName;
    case "backrest.code_finish": return `${decoded.backrest.code}${decoded.backrest.finish} (${decoded.backrest.finishName})`;
    case "backrest.frame": return decoded.backrest.frame || "-";
    case "backrest.top": return decoded.backrest.top || "-";
    case "backrest.springType": return decoded.backrest.springType || "-";
    case "backrest.foams_summary":
    case "backrest.foamsList": {
      const lines = formatFoamsDetailed(decoded.backrest.foams);
      return lines.length > 0 ? lines.join("\n") : decoded.backrest.foam || "-";
    }

    case "side.code": return decoded.side.code;
    case "side.finish_name": return decoded.side.finishName;
    case "side.code_finish": return `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`;
    case "side.frame": return decoded.side.frame || "-";
    case "side.foam": return "-";

    case "chest.name": return decoded.chest.name || "-";
    case "chest_automat.label": return `${decoded.chest.code} + ${decoded.automat.code}`;
    case "automat.code_name": return `${decoded.automat.code} - ${decoded.automat.name}`;

    case "legs.code_color": return decoded.legs ? `${decoded.legs.code}${decoded.legs.color || ""}` : "-";
    case "legHeights.sofa_chest_info": {
      const cl = decoded.legHeights.sofa_chest;
      return cl ? `${cl.leg} H ${cl.height}cm (${cl.count} szt)` : "-";
    }
    case "legHeights.sofa_seat_info": {
      const sl = decoded.legHeights.sofa_seat;
      return sl ? `${sl.leg} H ${sl.height}cm (${sl.count} szt)` : "BRAK";
    }

    case "pillow.code": return decoded.pillow?.code || "-";
    case "pillow.name": return decoded.pillow ? decoded.pillow.name.replace(/^Poduszka\s+/i, "") : "-";
    case "pillow.finish_info": return decoded.pillow ? `${decoded.pillow.finish} (${decoded.pillow.finishName})` : "-";
    case "pillow.construction_type": return (decoded.pillow as any)?.constructionType || "-";
    case "pillow.insert_type": return (decoded.pillow as any)?.insertType || "-";

    case "jaski.code": return decoded.jaski?.code || "-";
    case "jaski.name": return decoded.jaski?.name || "-";
    case "jaski.finish_info": return decoded.jaski ? `${decoded.jaski.finish} (${decoded.jaski.finishName})` : "-";
    case "jaski.construction_type": return (decoded.jaski as any)?.constructionType || "-";
    case "jaski.insert_type": return (decoded.jaski as any)?.insertType || "-";

    case "walek.code": return decoded.walek?.code || "-";
    case "walek.name": return decoded.walek?.name || "-";
    case "walek.finish_info": return decoded.walek ? `${decoded.walek.finish} (${decoded.walek.finishName})` : "-";
    case "walek.construction_type": return (decoded.walek as any)?.constructionType || "-";
    case "walek.insert_type": return (decoded.walek as any)?.insertType || "-";

    case "pufaSeat.frontBack": return decoded.pufaSeat?.frontBack || "-";
    case "pufaSeat.sides": return decoded.pufaSeat?.sides || "-";
    case "pufaSeat.foam": return decoded.pufaSeat?.foam || "-";
    case "pufaSeat.box": return decoded.pufaSeat?.box || "-";
    case "pufaLegs.code": return decoded.pufaLegs?.code || "-";
    case "pufaLegs.count_info": return decoded.pufaLegs ? `${decoded.pufaLegs.count} szt` : "-";
    case "pufaLegs.height_info": return decoded.pufaLegs ? `H ${decoded.pufaLegs.height}cm` : "-";

    case "fotelLegs.code": return decoded.fotelLegs?.code || "-";
    case "fotelLegs.count_info": return decoded.fotelLegs ? `${decoded.fotelLegs.count} szt` : "-";
    case "fotelLegs.height_info": return decoded.fotelLegs ? `H ${decoded.fotelLegs.height}cm` : "-";

    case "extras.label": return "";
    case "extras.pufa_sku": return decoded.pufaSKU || "-";
    case "extras.fotel_sku": return decoded.fotelSKU || "-";

    default: break;
  }

  // Generic dot-path resolution
  const parts = field.split(".");
  let val: any = decoded;
  for (const p of parts) {
    if (val == null) return "-";
    val = val[p];
  }
  if (val == null || val === "") return "-";
  if (typeof val === "boolean") return val ? "TAK" : "NIE";
  return String(val);
}

/**
 * Check if the condition field is truthy in decoded data.
 */
export function checkDecodedCondition(decoded: DecodedSKU, conditionField: string): boolean {
  if (conditionField === "extras_pufa_fotel") {
    const hasPufa = decoded.extras.some(e => e.type === "pufa");
    const hasFotel = decoded.extras.some(e => e.type === "fotel");
    return hasPufa || hasFotel || !!decoded.pufaSKU || !!decoded.fotelSKU;
  }
  const parts = conditionField.split(".");
  let val: any = decoded;
  for (const p of parts) {
    if (val == null) return false;
    val = val[p];
  }
  return val != null && val !== false && val !== "";
}
