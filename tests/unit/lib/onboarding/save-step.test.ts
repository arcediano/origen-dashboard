import { describe, it, expect, vi, beforeEach } from 'vitest';

const uploadFile = vi.fn();
const saveStep1 = vi.fn(); const saveStep2 = vi.fn(); const saveStep3 = vi.fn(); const saveStep4 = vi.fn(); const saveStep5 = vi.fn();
vi.mock('@/lib/api/media', () => ({ uploadFile: (...a: unknown[]) => uploadFile(...a) }));
vi.mock('@/lib/api/onboarding', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/onboarding')>('@/lib/api/onboarding');
  return { ...actual, saveStep1: (...a: unknown[]) => saveStep1(...a), saveStep2: (...a: unknown[]) => saveStep2(...a), saveStep3: (...a: unknown[]) => saveStep3(...a), saveStep4: (...a: unknown[]) => saveStep4(...a), saveStep5: (...a: unknown[]) => saveStep5(...a) };
});

import { saveOnboardingStep } from '@/lib/onboarding/save-step';
import { INITIAL_FORM_DATA } from '@/lib/onboarding/types';

const newFile = (name: string) => ({ id: name, name, size: 1, type: 'image/png', file: new File(['x'], name, { type: 'image/png' }) });
const stored = (key: string) => ({ id: key, key, name: key, size: 0, type: 'image/png' });

beforeEach(() => {
  vi.clearAllMocks();
  let n = 0;
  uploadFile.mockImplementation(async () => ({ key: `up-${++n}` }));
});

describe('saveOnboardingStep', () => {
  it('paso 2: sube solo lo nuevo, reutiliza claves hidratadas y marca lo subido', async () => {
    const form = { ...INITIAL_FORM_DATA, step2: { logo: newFile('logo'), banner: stored('b-key'), teamPhotos: [stored('t1'), newFile('t2')], introVideo: '' } };
    const patch = await saveOnboardingStep(1, form);
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(saveStep2).toHaveBeenCalledWith({ logoKey: 'up-1', bannerKey: 'b-key', teamPhotoKeys: ['t1', 'up-2'], introVideoUrl: '' });
    expect(patch.step2?.logo).toMatchObject({ key: 'up-1', file: undefined });
  });

  it('paso 1: fotos del local = hidratadas + nuevas', async () => {
    const form = { ...INITIAL_FORM_DATA, step1: { ...INITIAL_FORM_DATA.step1, locationImages: [stored('a'), newFile('b')] } };
    await saveOnboardingStep(0, form);
    expect(saveStep1.mock.calls[0][1]).toEqual(['a', 'up-1']);
  });

  it('paso 3: exige elección', async () => {
    await expect(saveOnboardingStep(2, INITIAL_FORM_DATA)).rejects.toThrow(/Elige/);
    expect(saveStep3).not.toHaveBeenCalled();
  });

  it('paso 4: documentos hidratados no se resuben; certificación sin documento se declara sin clave', async () => {
    const form = {
      ...INITIAL_FORM_DATA,
      step4: {
        cif: { file: stored('cif-key'), expiresAt: '2030-01-01' },
        seguroRc: { file: newFile('rc'), expiresAt: '2030-01-01' },
        manipulador: { file: stored('m-key'), expiresAt: '2030-01-01' },
        certifications: [{ certificationId: 'ecologico' }, { certificationId: 'vegano', file: newFile('v'), expiresAt: '2031-01-01' }],
      },
    };
    const patch = await saveOnboardingStep(3, form);
    expect(uploadFile).toHaveBeenCalledTimes(2);
    const keys = saveStep4.mock.calls[0][1];
    expect(keys).toMatchObject({ cifKey: 'cif-key', seguroRcKey: 'up-1', manipuladorAlimentosKey: 'm-key' });
    expect(keys.certifications).toEqual([
      { certificationId: 'ecologico', documentKey: undefined, expiresAt: undefined },
      { certificationId: 'vegano', documentKey: 'up-2', expiresAt: '2031-01-01' },
    ]);
    expect(patch.step4?.seguroRc.file).toMatchObject({ key: 'up-1', file: undefined });
  });

  it('paso 5: no envía stripeConnected', async () => {
    await saveOnboardingStep(4, { ...INITIAL_FORM_DATA, step5: { stripeConnected: true, stripeAccountId: 'acct', acceptTerms: true } });
    expect(saveStep5).toHaveBeenCalledWith({ stripeAccountId: 'acct', acceptTerms: true });
  });

  it('rechaza pasos que ya no existen (numeración vieja: 6 y 7)', async () => {
    await expect(saveOnboardingStep(5, INITIAL_FORM_DATA)).rejects.toThrow();
    await expect(saveOnboardingStep(6, INITIAL_FORM_DATA)).rejects.toThrow();
  });
});
