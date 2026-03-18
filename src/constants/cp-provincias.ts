/**
 * Mapa de prefijo CP (2 dígitos) → nombre de provincia
 * Los valores coinciden exactamente con las entradas de PROVINCIAS_ESPANA
 * @module constants/cp-provincias
 */

export const CP_PROVINCIA: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Baleares',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'La Coruña',
  '16': 'Cuenca',
  '17': 'Gerona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Guipúzcoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lérida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Orense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Vizcaya',
  '49': 'Zamora',
  '50': 'Zaragoza',
};

/**
 * Devuelve el nombre de provincia (tal como aparece en PROVINCIAS_ESPANA) para un CP dado.
 * Retorna null si el prefijo no está reconocido.
 */
export function getProvinciaFromCP(cp: string): string | null {
  const prefix = cp.slice(0, 2);
  return CP_PROVINCIA[prefix] ?? null;
}
