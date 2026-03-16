'use client';

import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export function ContactInfo() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Contacto</h2>
      
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-origen-pradera/10 rounded-lg text-origen-pradera">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
            <p className="text-gray-600 mt-1">Calle Ejemplo 123, 28001</p>
            <p className="text-gray-600">Madrid, España</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-origen-pradera/10 rounded-lg text-origen-pradera">
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Teléfono</h3>
            <p className="text-gray-600 mt-1">+34 91 123 45 67</p>
            <p className="text-sm text-gray-500 mt-1">Lunes a Viernes: 9:00 - 18:00</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-origen-pradera/10 rounded-lg text-origen-pradera">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email</h3>
            <p className="text-gray-600 mt-1">info@origen.com</p>
            <p className="text-gray-600">soporte@origen.com</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-origen-pradera/10 rounded-lg text-origen-pradera">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Horario</h3>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <span className="text-gray-600">Lunes-Viernes:</span>
              <span className="text-gray-900 font-medium">9:00 - 18:00</span>
              <span className="text-gray-600">Sábados:</span>
              <span className="text-gray-900 font-medium">10:00 - 14:00</span>
              <span className="text-gray-600">Domingos:</span>
              <span className="text-gray-900 font-medium">Cerrado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}