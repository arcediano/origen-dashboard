import { describe, expect, it } from 'vitest';
import { scoreCommercialProfile } from '@/lib/profile/commercial-score';
import type { ProducerProfileData } from '@/lib/api/producers';

const long = (n: number) => 'x'.repeat(n);
const img = { key: 'k', url: 'u' };

const full = {
  fiscal: null,
  location: null,
  story: { tagline: 'Miel de la sierra, hecha a mano', description: long(200), productionPhilosophy: long(100), values: ['Local'] },
  visual: { logoUrl: 'l', bannerUrl: 'b', logoKey: 'l', bannerKey: 'b', teamPhotos: [img], locationImages: [img], galleryImages: [img, img, img] },
} as unknown as ProducerProfileData;

describe('scoreCommercialProfile', () => {
  it('perfil completo = 100 % y sin pendientes; los pesos suman 100', () => {
    const s = scoreCommercialProfile(full);
    expect(s.percent).toBe(100);
    expect(s.missing).toEqual([]);
    expect(s.criteria.reduce((a, c) => a + c.weight, 0)).toBe(100);
  });

  it('sin datos = 0 % y propone primero lo que más pesa', () => {
    const s = scoreCommercialProfile(null);
    expect(s.percent).toBe(0);
    expect(s.missing[0].key).toBe('description'); // 20 puntos
    expect(s.missing[1].key).toBe('gallery'); // 15 puntos
  });

  it('un texto sin sustancia no cuenta; con ella, sí', () => {
    const short = { ...full, story: { ...full.story, description: 'hola', tagline: 'miel' } } as ProducerProfileData;
    const s = scoreCommercialProfile(short);
    expect(s.missing.map((c) => c.key).sort()).toEqual(['description', 'tagline']);
    expect(s.percent).toBe(70);
  });

  it('la galería necesita 3 fotos; fotos de equipo y entorno cuentan con una', () => {
    const two = { ...full, visual: { ...full.visual, galleryImages: [img, img] } } as ProducerProfileData;
    expect(scoreCommercialProfile(two).missing.map((c) => c.key)).toEqual(['gallery']);
  });

  it('marca qué pendientes puede ayudar la IA (textos y fotos) y cuáles no (logo, portada, valores)', () => {
    const s = scoreCommercialProfile(null);
    const ai = Object.fromEntries(s.criteria.map((c) => [c.key, c.aiCanHelp]));
    expect(ai).toMatchObject({ description: true, tagline: true, gallery: true, logo: false, banner: false, values: false });
  });
});
