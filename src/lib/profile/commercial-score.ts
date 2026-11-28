/**
 * Calidad del PERFIL COMERCIAL del productor (lo que ve el comprador en su tienda), distinta de la completitud
 * administrativa (datos fiscales, documentos, Stripe), que ya tiene su propio control. Cada criterio tiene un peso
 * y una sugerencia concreta; la suma de pesos es 100. El texto cuenta solo si tiene sustancia (no un «hola»).
 */

import type { ProducerProfileData } from '@/lib/api/producers';

export interface CommercialCriterion {
  key: string;
  /** Qué se pide, en positivo: «Añade una foto de tu equipo». */
  label: string;
  /** Puntos que aporta al 100 %. */
  weight: number;
  done: boolean;
  /** Si lo puede mejorar la revisión con IA (textos y fotos) o hay que subirlo a mano. */
  aiCanHelp: boolean;
}

export interface CommercialProfileScore {
  percent: number;
  criteria: CommercialCriterion[];
  /** Los pendientes que más suben el porcentaje, de mayor a menor peso. */
  missing: CommercialCriterion[];
}

const MIN_TAGLINE = 15;
const MIN_DESCRIPTION = 150;
const MIN_PHILOSOPHY = 80;
const MIN_GALLERY = 3;

const len = (s: string | null | undefined) => (s ?? '').trim().length;
const count = (l: unknown[] | undefined) => (l ?? []).length;

export function scoreCommercialProfile(data: ProducerProfileData | null | undefined): CommercialProfileScore {
  const story = data?.story ?? null;
  const visual = data?.visual ?? null;
  const criteria: CommercialCriterion[] = [
    { key: 'logo', label: 'Sube el logo de tu negocio', weight: 10, done: !!visual?.logoUrl, aiCanHelp: false },
    { key: 'banner', label: 'Añade una imagen de portada', weight: 10, done: !!visual?.bannerUrl, aiCanHelp: false },
    { key: 'tagline', label: 'Escribe un eslogan que te describa', weight: 10, done: len(story?.tagline) >= MIN_TAGLINE, aiCanHelp: true },
    {
      key: 'description',
      label: 'Cuenta la historia de tu negocio (unas 3-4 frases)',
      weight: 20,
      done: len(story?.description) >= MIN_DESCRIPTION,
      aiCanHelp: true,
    },
    {
      key: 'philosophy',
      label: 'Explica cómo produces o elaboras',
      weight: 10,
      done: len(story?.productionPhilosophy) >= MIN_PHILOSOPHY,
      aiCanHelp: true,
    },
    { key: 'team', label: 'Añade una foto de tu equipo', weight: 10, done: count(visual?.teamPhotos) > 0, aiCanHelp: true },
    { key: 'location', label: 'Añade una foto de tu entorno o instalaciones', weight: 10, done: count(visual?.locationImages) > 0, aiCanHelp: true },
    {
      key: 'gallery',
      label: `Sube al menos ${MIN_GALLERY} fotos de tu proceso o producto`,
      weight: 15,
      done: count(visual?.galleryImages) >= MIN_GALLERY,
      aiCanHelp: true,
    },
    { key: 'values', label: 'Indica los valores que te definen', weight: 5, done: count(story?.values) > 0, aiCanHelp: false },
  ];
  const percent = criteria.filter((c) => c.done).reduce((sum, c) => sum + c.weight, 0);
  const missing = criteria.filter((c) => !c.done).sort((a, b) => b.weight - a.weight);
  return { percent, criteria, missing };
}
