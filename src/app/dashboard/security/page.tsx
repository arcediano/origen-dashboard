// 📁 /src/app/dashboard/security/page.tsx
// Redirect legacy a la nueva ruta de seguridad

import { redirect } from 'next/navigation';

export default function SecurityPageLegacy() {
  redirect('/dashboard/account/security');
}
