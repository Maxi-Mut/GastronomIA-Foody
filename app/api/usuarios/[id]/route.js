import { NextResponse } from 'next/server';
import DataAccess from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params?.id || 1;
    const usuario = DataAccess.getUsuario(id);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ usuario }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/usuarios/[id]:', error);
    return NextResponse.json({ error: 'Error al consultar perfil de usuario', detalle: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params?.id || 1;
    const body = await request.json().catch(() => ({}));
    
    const usuarioActualizado = DataAccess.updateUsuario(id, body);
    if (!usuarioActualizado) {
      return NextResponse.json({ error: 'Usuario no encontrado para actualizar' }, { status: 404 });
    }

    return NextResponse.json({
      mensaje: 'Perfil y preferencias actualizadas con éxito.',
      usuario: usuarioActualizado
    }, { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/usuarios/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil de usuario', detalle: error.message }, { status: 500 });
  }
}
