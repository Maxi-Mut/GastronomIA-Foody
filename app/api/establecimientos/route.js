import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filtros = {
      zona: searchParams.get('zona') || '',
      barrio: searchParams.get('barrio') || '',
      cocina: searchParams.get('cocina') || '',
      presupuesto: searchParams.get('presupuesto') || '',
      dieta: searchParams.get('dieta') || '',
      ambiente: searchParams.get('ambiente') || '',
      query: searchParams.get('q') || searchParams.get('search') || searchParams.get('query') || ''
    };

    const establecimientos = DataAccess.getEstablecimientos(filtros);
    return NextResponse.json({
      total: establecimientos.length,
      filtros_aplicados: filtros,
      establecimientos
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/establecimientos:', error);
    return NextResponse.json({ error: 'Error al consultar establecimientos', detalle: error.message }, { status: 500 });
  }
}
