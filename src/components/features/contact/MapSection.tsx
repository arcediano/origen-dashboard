'use client';

export function MapSection() {
  return (
    <div className="bg-surface-alt rounded-xl shadow-lg overflow-hidden">
      <div className="h-64 w-full bg-surface relative">
        {/* Esto sería reemplazado por un componente de mapa real como Google Maps */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-origen-pradera rounded-full flex items-center justify-center text-white mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-foreground font-medium">Calle Ejemplo 123, Madrid</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Nuestras oficinas están ubicadas en el centro de Madrid
        </p>
      </div>
    </div>
  );
}
