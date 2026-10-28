import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';
import servicioIA from '@/lib/servicioIA';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const establecimiento_id = body.establecimiento_id;
    const usuario_id = body.usuario_id || 1;
    const puntuacion = parseInt(body.puntuacion || 5, 10);
    const comentario = (body.comentario || '').trim();

    if (!establecimiento_id) {
      return NextResponse.json({ error: 'establecimiento_id es obligatorio' }, { status: 400 });
    }
    if (!comentario) {
      return NextResponse.json({ error: 'El comentario de la reseña no puede estar vacío' }, { status: 400 });
    }

    // Disparar extracción de valoraciones con componente de IA
    const valoracionesExtraidas = await servicioIA.extraerValoraciones(comentario);

    // Guardar reseña y valoraciones en la capa de datos
    const resenaId = DataAccess.crearResena(
      establecimiento_id,
      usuario_id,
      puntuacion,
      comentario,
      valoracionesExtraidas
    );

    return NextResponse.json({
      mensaje: 'Reseña registrada con éxito y valoraciones extraídas por IA.',
      resena_id: resenaId,
      establecimiento_id,
      puntuacion,
      comentario,
      valoraciones_extraidas: valoracionesExtraidas
    }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/resenas:', error);
    return NextResponse.json({ error: 'Error al registrar reseña', detalle: error.message }, { status: 500 });
  }
}
