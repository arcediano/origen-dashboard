/**
 * @page Configuración de Envíos
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/atoms/button';
import { Card } from '@/components/ui/atoms/card';
import { Input } from '@/components/ui/atoms/input';
import { ArrowLeft, Save, Plus, Truck, Zap, Store } from 'lucide-react';

export default function EnviosPage() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/configuracion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-origen-bosque">Métodos de envío</h1>
            <p className="text-sm text-gray-500">Configura cómo entregas tus productos</p>
          </div>
        </div>
        <Button onClick={() => setIsSaving(true)} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
          <Save className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-origen-bosque">Opciones de envío</h2>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Añadir método
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Envío estándar</h3>
                  <p className="text-xs text-gray-500">Entrega en 2-3 días laborables</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">5.90€</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-origen-crema/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-origen-pradera" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Envío exprés</h3>
                  <p className="text-xs text-gray-500">Entrega en 24 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">8.90€</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Recogida en local</h3>
                  <p className="text-xs text-gray-500">Sin coste de envío</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">0.00€</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-origen-bosque mb-4">Zonas de entrega</h2>
          <div className="flex flex-wrap gap-2">
            {['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Toledo'].map((city) => (
              <span key={city} className="px-3 py-1.5 bg-origen-bosque text-white rounded-full text-xs">
                {city}
              </span>
            ))}
            <Button variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Añadir provincia
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}