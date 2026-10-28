import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de establecimiento no especificado' }, { status: 400 });
    }

    const venue = DataAccess.getEstablecimientoById(id);
    if (!venue) {
      return NextResponse.json({ error: 'Establecimiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      establecimiento: venue,
      advertencia_alimentaria: "⚠️ Información alimentaria: La información disponible no garantiza la ausencia de contaminación cruzada. Confirmá siempre con el local."
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/establecimientos/[id]:', error);
    return NextResponse.json({ error: 'Error al recuperar establecimiento', detalle: error.message }, { status: 500 });
  }
}
