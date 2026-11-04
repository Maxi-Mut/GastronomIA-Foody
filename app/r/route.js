import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Redirección para QR Dinámico
 * Escaneo: https://tu-dominio.vercel.app/r
 * Redirige dinámicamente según la variable QR_TARGET_URL configurada en Vercel o .env.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const canal = searchParams.get('c') || 'principal';

  // Destino configurable desde variables de entorno o valor por defecto
  let destino = process.env.QR_TARGET_URL || 'https://gastronomia-foody.vercel.app';

  // Opciones secundarias si se usa un parámetro ej: /r?c=menu o /r?c=instagram
  if (canal === 'menu' && process.env.QR_TARGET_MENU) {
    destino = process.env.QR_TARGET_MENU;
  } else if (canal === 'instagram' && process.env.QR_TARGET_IG) {
    destino = process.env.QR_TARGET_IG;
  }

  // Redirección HTTP 307 (Temporary Redirect)
  // Fundamental para evitar que los celulares guarden en caché el destino viejo al cambiarlo
  return NextResponse.redirect(destino, {
    status: 307,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

