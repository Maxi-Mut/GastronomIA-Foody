import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de conversación no especificado' }, { status: 400 });
    }

    const mensajes = DataAccess.getMensajesConversacion(id);
    return NextResponse.json({
      conversacion_id: parseInt(id, 10),
      total_mensajes: mensajes.length,
      mensajes
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/conversaciones/[id]/mensajes:', error);
    return NextResponse.json({ error: 'Error al recuperar mensajes de la conversación', detalle: error.message }, { status: 500 });
  }
}
