import { NextResponse } from 'next/server';
import backendOrquestador from '@/lib/backendOrquestador';

export async function GET() {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
  let proveedor = 'autonomo';
  if (process.env.GEMINI_API_KEY || process.env.AI_API_KEY) proveedor = 'Google Gemini';
  else if (process.env.GROQ_API_KEY) proveedor = 'Groq';
  else if (process.env.OPENAI_API_KEY) proveedor = 'OpenAI';

  return NextResponse.json({
    ia_conectada: hasKey,
    proveedor,
    modelo: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const consulta = body.consulta || body.message || '';
    const idUsuario = body.idUsuario || body.usuario_id || 1;
    const idConversacion = body.idConversacion || body.conversacion_id || null;

    if (!consulta.trim()) {
      return NextResponse.json(
        { error: 'El mensaje de consulta no puede estar vacío' },
        { status: 400 }
      );
    }

    const apiKey = body.apiKey || request.headers.get('x-ai-api-key') || '';

    const resultado = await backendOrquestador.procesarConsulta(consulta, idUsuario, idConversacion, apiKey);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Error en POST /api/chat:', error);
    return NextResponse.json(
      {
        error: 'Ocurrió un error al procesar tu consulta con Foody.',
        detalle: error.message,
        fallback_sugerido: 'Por favor, intentá nuevamente o utilizá los filtros manuales en Explorar.'
      },
      { status: 500 }
    );
  }
}
