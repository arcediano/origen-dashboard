/**
 * Comunidad autónoma de origen del producto (17 CCAA + Ceuta y Melilla) --
 * petición del humano, 2026-10-17. Códigos y nombres legibles idénticos a
 * `origen-master-microservices`
 * (`src/modules/products/common/utils/autonomous-community.ts`), ya que el
 * backend devuelve/recibe el código y aquí solo se traduce a nombre + bandera
 * para el selector del formulario.
 */

export const AUTONOMOUS_COMMUNITY_CODES = [
  "ANDALUCIA",
  "ARAGON",
  "ASTURIAS",
  "ISLAS_BALEARES",
  "CANARIAS",
  "CANTABRIA",
  "CASTILLA_LA_MANCHA",
  "CASTILLA_Y_LEON",
  "CATALUNA",
  "EXTREMADURA",
  "GALICIA",
  "MADRID",
  "MURCIA",
  "NAVARRA",
  "PAIS_VASCO",
  "LA_RIOJA",
  "COMUNIDAD_VALENCIANA",
  "CEUTA",
  "MELILLA",
] as const;

export type AutonomousCommunityCode = (typeof AUTONOMOUS_COMMUNITY_CODES)[number];

export const AUTONOMOUS_COMMUNITY_NAMES: Record<AutonomousCommunityCode, string> = {
  ANDALUCIA: "Andalucía",
  ARAGON: "Aragón",
  ASTURIAS: "Principado de Asturias",
  ISLAS_BALEARES: "Islas Baleares",
  CANARIAS: "Canarias",
  CANTABRIA: "Cantabria",
  CASTILLA_LA_MANCHA: "Castilla-La Mancha",
  CASTILLA_Y_LEON: "Castilla y León",
  CATALUNA: "Cataluña",
  EXTREMADURA: "Extremadura",
  GALICIA: "Galicia",
  MADRID: "Comunidad de Madrid",
  MURCIA: "Región de Murcia",
  NAVARRA: "Comunidad Foral de Navarra",
  PAIS_VASCO: "País Vasco",
  LA_RIOJA: "La Rioja",
  COMUNIDAD_VALENCIANA: "Comunidad Valenciana",
  CEUTA: "Ceuta",
  MELILLA: "Melilla",
};

/** Bandera SVG simplificada en `public/flags/ccaa/<código>.svg`. */
export function autonomousCommunityFlagSrc(code: AutonomousCommunityCode): string {
  return `/flags/ccaa/${code}.svg`;
}

export function isAutonomousCommunityCode(value: unknown): value is AutonomousCommunityCode {
  return (
    typeof value === "string" &&
    (AUTONOMOUS_COMMUNITY_CODES as readonly string[]).includes(value)
  );
}
