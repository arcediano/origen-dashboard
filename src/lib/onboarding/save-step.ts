/**
 * Guardado de un paso del onboarding: sube los archivos nuevos (S3) y llama al
 * endpoint del paso con el contrato ADR-020. Devuelve un parche del estado del
 * formulario donde los archivos recién subidos pasan a tener `key` (así no se
 * vuelven a subir si el productor regresa y guarda otra vez).
 */

import type { UploadedFile } from '@/components/shared/upload/file-upload';
import { uploadFile } from '@/lib/api/media';
import {
  resolveExpiresAt,
  saveStep1,
  saveStep2,
  saveStep3,
  saveStep4,
  saveStep5,
  type Step4Keys,
} from '@/lib/api/onboarding';
import type { CertificationSlot, DocumentSlot, OnboardingFormData } from './types';

/** Sube un archivo si es nuevo; si ya viene del servidor devuelve su clave. */
async function ensureKey(
  file: UploadedFile | null | undefined,
  category: string,
  options?: Parameters<typeof uploadFile>[2],
): Promise<string | undefined> {
  if (!file) return undefined;
  if (file.file) return (await uploadFile(file.file, category, options)).key;
  return file.key;
}

const withKey = (file: UploadedFile, key: string | undefined): UploadedFile =>
  key && file.file ? { ...file, file: undefined, key } : file;

export type StepPatch = Partial<OnboardingFormData>;

export async function saveOnboardingStep(stepIndex: number, form: OnboardingFormData): Promise<StepPatch> {
  switch (stepIndex) {
    case 0: {
      const keys = await Promise.all(
        form.step1.locationImages.map((f) => ensureKey(f, 'visual/location')),
      ).catch((e) => {
        throw new Error(`No se pudieron subir las fotos del local: ${e instanceof Error ? e.message : 'error desconocido'}`);
      });
      await saveStep1(form.step1, keys.filter((k): k is string => Boolean(k)));
      return {
        step1: { ...form.step1, locationImages: form.step1.locationImages.map((f, i) => withKey(f, keys[i])) },
      };
    }

    case 1: {
      const [logoKey, bannerKey, ...teamKeys] = await Promise.all([
        ensureKey(form.step2.logo, 'visual/logo'),
        ensureKey(form.step2.banner, 'visual/banner'),
        ...form.step2.teamPhotos.map((f) => ensureKey(f, 'visual/team')),
      ]);
      await saveStep2({
        logoKey,
        bannerKey,
        teamPhotoKeys: teamKeys.filter((k): k is string => Boolean(k)),
        introVideoUrl: form.step2.introVideo,
      });
      return {
        step2: {
          ...form.step2,
          logo: form.step2.logo ? withKey(form.step2.logo, logoKey) : null,
          banner: form.step2.banner ? withKey(form.step2.banner, bannerKey) : null,
          teamPhotos: form.step2.teamPhotos.map((f, i) => withKey(f, teamKeys[i])),
        },
      };
    }

    case 2: {
      if (!form.step3.deliveryChoice) throw new Error('Elige cómo vas a gestionar el envío.');
      await saveStep3({ ...form.step3, deliveryChoice: form.step3.deliveryChoice });
      return {};
    }

    case 3: {
      const d = form.step4;
      const [cifKey, cifBackKey, seguroRcKey, manipuladorAlimentosKey] = await Promise.all([
        ensureKey(d.cif.file, 'documents/cif'),
        ensureKey(d.cif.fileBack, 'documents/cif'),
        ensureKey(d.seguroRc.file, 'documents/seguro-rc'),
        ensureKey(d.manipulador.file, 'documents/manipulador-alimentos'),
      ]);
      const certKeys = await Promise.all(
        d.certifications.map((c) =>
          ensureKey(c.file, `documents/certifications/${c.certificationId}`, {
            entityType: 'certifications',
            entityId: c.certificationId,
          }),
        ),
      );
      const keys: Step4Keys = {
        cifKey,
        cifBackKey,
        seguroRcKey,
        manipuladorAlimentosKey,
        certifications: d.certifications.map((c, i) => ({
          certificationId: c.certificationId,
          documentKey: certKeys[i],
          // La caducidad solo viaja con el documento (es obligatoria en cuanto hay clave).
          expiresAt: certKeys[i] ? resolveExpiresAt(c) : undefined,
        })),
      };
      await saveStep4(d, keys);
      const settle = (slot: DocumentSlot, key: string | undefined): DocumentSlot => ({
        ...slot,
        file: slot.file ? withKey(slot.file, key) : undefined,
      });
      return {
        step4: {
          cif: { ...settle(d.cif, cifKey), fileBack: d.cif.fileBack ? withKey(d.cif.fileBack, cifBackKey) : undefined },
          seguroRc: settle(d.seguroRc, seguroRcKey),
          manipulador: settle(d.manipulador, manipuladorAlimentosKey),
          certifications: d.certifications.map((c, i): CertificationSlot => ({ ...settle(c, certKeys[i]), certificationId: c.certificationId })),
        },
      };
    }

    case 4: {
      await saveStep5({ stripeAccountId: form.step5.stripeAccountId, acceptTerms: form.step5.acceptTerms });
      return {};
    }

    default:
      throw new Error(`Paso de onboarding desconocido: ${stepIndex}`);
  }
}
