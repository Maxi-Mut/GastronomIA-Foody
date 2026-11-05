import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F5] dark:bg-[#131915] text-neutral-800 dark:text-neutral-100 p-6">
      <div className="flex flex-col items-center max-w-xs text-center space-y-6 animate-fadeIn">
        {/* Logo e Ilustración de Foody */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#D4AF37]/30 bg-white p-2">
          <Image
            src="/foody_splash.png"
            alt="Foody - Tu asistente de GastronomIA"
            fill
            className="object-contain p-2"
            priority
          />
        </div>

        {/* Textos y Barra de Carga */}
        <div className="space-y-2.5 w-full">
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#133829] dark:text-emerald-400">
            GastronomIA
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Preparando tu mesa y cargando sabores de Buenos Aires...
          </p>

          <div className="w-48 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto overflow-hidden mt-3 shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#133829] via-[#D4AF37] to-[#133829] animate-pulse rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

