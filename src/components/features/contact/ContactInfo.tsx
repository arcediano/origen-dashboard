'use client';

import { Phone, Mail, Clock } from 'lucide-react';

export function ContactInfo() {
  return (
    <div className="bg-surface-alt rounded-xl shadow-lg p-6 md:p-8">
      <h2 className="text-2xl font-bold text-origen-bosque mb-6 md:mb-8">Información de Contacto</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Teléfono */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
            <Phone className="w-5 h-5 text-origen-bosque" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-origen-bosque">Teléfono</h3>
            <p className="text-muted-foreground mt-1">+34 91 123 45 67</p>
            <p className="text-sm text-muted-foreground mt-1">Lunes a Viernes: 9:00 - 18:00</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
            <Mail className="w-5 h-5 text-origen-bosque" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-origen-bosque">Email</h3>
            <p className="text-muted-foreground mt-1">info@origen.com</p>
            <p className="text-muted-foreground">soporte@origen.com</p>
          </div>
        </div>

        {/* Horario */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
            <Clock className="w-5 h-5 text-origen-bosque" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-origen-bosque">Horario</h3>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <span className="text-muted-foreground">Lunes-Viernes:</span>
              <span className="text-foreground font-medium">9:00 - 18:00</span>
              <span className="text-muted-foreground">Sábados:</span>
              <span className="text-foreground font-medium">10:00 - 14:00</span>
              <span className="text-muted-foreground">Domingos:</span>
              <span className="text-foreground font-medium">Cerrado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
