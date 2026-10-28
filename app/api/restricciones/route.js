import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';

export async function GET() {
  try {
    const restricciones = DataAccess.getRestricciones();
    return NextResponse.json({ total: restricciones.length, restricciones }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/restricciones:', error);
    return NextResponse.json({ error: 'Error al recuperar restricciones', detalle: error.message }, { status: 500 });
  }
}
