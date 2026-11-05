'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Download,
  ExternalLink,
  Sparkles,
  Check,
  Copy,
  QrCode,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

export default function QRManagerPage() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'flyer'
  const [qrRendered, setQrRendered] = useState(false);

  const qrCanvasRef = useRef(null);
  const flyerCanvasRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const redirectUrl = origin ? `${origin}/r` : 'https://gastronomia-foody.vercel.app/r';

  // Función para dibujar rectángulo con esquinas redondeadas en canvas
  const roundRect = (ctx, x, y, width, height, radius, fill = true, stroke = false) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  };

  // Renderizar el QR con estilo exacto al de la imagen
  useEffect(() => {
    if (!redirectUrl) return;

    const mascot = new window.Image();
    mascot.crossOrigin = 'anonymous';
    mascot.src = '/foody_mascot.png';

    mascot.onload = () => {
      renderStyledQR(mascot);
      renderFlyer(mascot);
      setQrRendered(true);
    };

    mascot.onerror = () => {
      renderStyledQR(null);
      renderFlyer(null);
      setQrRendered(true);
    };
  }, [redirectUrl]);

  const renderStyledQR = (mascotImg, targetCanvas = qrCanvasRef.current) => {
    if (!targetCanvas) return;
    const canvas = targetCanvas;
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Generar matriz QR con nivel de redundancia H (High - 30% recuperable)
    const qr = QRCode.create(redirectUrl, { errorCorrectionLevel: 'H' });
    const size = qr.modules.size;

    const padding = 70;
    const usableSize = width - padding * 2;
    const cellSize = usableSize / size;

    const colorBg = '#FCE7A2'; // Fondo amarillo cálido como en la foto
    const colorBorder = '#F59E0B'; // Borde dorado
    const colorDot = '#133829'; // Verde Foody
    const colorEyeOuter = '#133829';
    const colorEyeInner = '#F59E0B'; // Ojo central naranja/dorado

    ctx.clearRect(0, 0, width, height);

    // 1. Fondo suavemente redondeado
    ctx.fillStyle = colorBg;
    ctx.strokeStyle = colorBorder;
    ctx.lineWidth = 14;
    roundRect(ctx, 16, 16, width - 32, height - 32, 55, true, true);

    // 2. Medallón central (área del logo)
    const centerX = width / 2;
    const centerY = height / 2;
    const medallionRadius = usableSize * 0.175;

    // 3. Dibujar puntos de datos (círculos)
    ctx.fillStyle = colorDot;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Excluir los 3 ojos de posición (7x7)
        const isTopLeftEye = r < 7 && c < 7;
        const isTopRightEye = r < 7 && c >= size - 7;
        const isBottomLeftEye = r >= size - 7 && c < 7;
        if (isTopLeftEye || isTopRightEye || isBottomLeftEye) continue;

        const mx = padding + (c + 0.5) * cellSize;
        const my = padding + (r + 0.5) * cellSize;

        // Excluir área que ocupará el medallón de Foody
        const distToCenter = Math.hypot(mx - centerX, my - centerY);
        if (distToCenter < medallionRadius + cellSize * 0.7) continue;

        if (qr.modules.get(r, c)) {
          ctx.beginPath();
          ctx.arc(mx, my, cellSize * 0.44, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. Dibujar los 3 Ojos con esquinas redondeadas y centro dorado (idénticos a la imagen)
    const eyes = [
      { r: 0, c: 0 },
      { r: 0, c: size - 7 },
      { r: size - 7, c: 0 }
    ];

    eyes.forEach(({ r, c }) => {
      const ex = padding + c * cellSize;
      const ey = padding + r * cellSize;
      const ew = 7 * cellSize;

      // Marco exterior verde redondeado
      ctx.fillStyle = colorEyeOuter;
      roundRect(ctx, ex, ey, ew, ew, cellSize * 2.3, true, false);

      // Espacio intermedio amarillo
      ctx.fillStyle = colorBg;
      roundRect(ctx, ex + cellSize, ey + cellSize, 5 * cellSize, 5 * cellSize, cellSize * 1.6, true, false);

      // Pupila central dorada/naranja redondeada
      ctx.fillStyle = colorEyeInner;
      roundRect(ctx, ex + 2 * cellSize, ey + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 1.2, true, false);
    });

    // 5. Medallón central de Foody
    // Sombra suave para dar relieve
    ctx.save();
    ctx.shadowColor = 'rgba(19, 56, 41, 0.25)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Círculo base blanco con borde dorado
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, medallionRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Aro interior decorativo amarillo crema
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(centerX, centerY, medallionRadius - 7, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar mascota de Foody
    if (mascotImg) {
      const imgSize = medallionRadius * 1.65;
      ctx.drawImage(
        mascotImg,
        centerX - imgSize / 2,
        centerY - imgSize / 2 - 2,
        imgSize,
        imgSize
      );
    }
  };

  const renderFlyer = (mascotImg) => {
    const canvas = flyerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 900;
    const height = 1250;
    canvas.width = width;
    canvas.height = height;

    // Fondo general beige/crema claro
    ctx.fillStyle = '#FAF8F0';
    ctx.fillRect(0, 0, width, height);

    // Marco exterior redondeado verde bosque
    ctx.strokeStyle = '#133829';
    ctx.lineWidth = 12;
    roundRect(ctx, 35, 35, width - 70, height - 70, 48, false, true);

    // Decoraciones: Hojas y destellos (como en el flyer)
    ctx.fillStyle = '#133829';
    // Estrellitas doradas
    ctx.fillStyle = '#F59E0B';
    const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };

    drawStar(140, 180, 4, 18, 7);
    drawStar(760, 180, 4, 18, 7);
    drawStar(110, 560, 4, 14, 6);
    drawStar(790, 560, 4, 14, 6);

    // 1. Cabecera: Pill "Foody"
    ctx.fillStyle = '#133829';
    roundRect(ctx, width / 2 - 180, 80, 360, 110, 55, true, false);

    // Rayitas decorativas doradas al lado de Foody
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // Izquierda
    ctx.beginPath();
    ctx.moveTo(width / 2 - 210, 120);
    ctx.lineTo(width / 2 - 235, 110);
    ctx.moveTo(width / 2 - 215, 140);
    ctx.lineTo(width / 2 - 245, 140);
    ctx.moveTo(width / 2 - 210, 160);
    ctx.lineTo(width / 2 - 235, 170);
    ctx.stroke();

    // Derecha
    ctx.beginPath();
    ctx.moveTo(width / 2 + 210, 120);
    ctx.lineTo(width / 2 + 235, 110);
    ctx.moveTo(width / 2 + 215, 140);
    ctx.lineTo(width / 2 + 245, 140);
    ctx.moveTo(width / 2 + 210, 160);
    ctx.lineTo(width / 2 + 235, 170);
    ctx.stroke();

    // Texto Foody
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 68px "Sour Gummy", "Bubblegum Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Foody', width / 2, 135);
    ctx.strokeStyle = '#133829';
    ctx.lineWidth = 4;
    ctx.strokeText('Foody', width / 2, 135);

    // Subtítulo: Tu asistente de GastronomIA
    ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#133829';
    ctx.fillText('Tu asistente de', width / 2, 225);

    ctx.font = '900 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Gastronom', width / 2 - 20, 268);
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('IA', width / 2 + 120, 268);

    // 2. Dibujar el QR estilizado en el centro del flyer
    const qrCanvas = document.createElement('canvas');
    renderStyledQR(mascotImg, qrCanvas);
    const qrDisplaySize = 580;
    const qrX = (width - qrDisplaySize) / 2;
    const qrY = 320;
    ctx.drawImage(qrCanvas, qrX, qrY, qrDisplaySize, qrDisplaySize);

    // 3. Banner Inferior: "¡ESCANÉAME Y DESCUBRE NUEVOS SABORES!"
    ctx.fillStyle = '#133829';
    roundRect(ctx, 80, 940, width - 160, 85, 42, true, false);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('¡ESCANÉAME Y DESCUBRE NUEVOS SABORES!', width / 2, 982);


    // Línea inferior decorativa
    ctx.strokeStyle = '#133829';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(90, 1145);
    ctx.lineTo(width - 90, 1145);
    ctx.stroke();

    // Rayos en las esquinas inferiores
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(60, 950);
    ctx.lineTo(40, 930);
    ctx.moveTo(75, 930);
    ctx.lineTo(60, 905);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 60, 950);
    ctx.lineTo(width - 40, 930);
    ctx.moveTo(width - 75, 930);
    ctx.lineTo(width - 60, 905);
    ctx.stroke();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foody_qr_personalizado.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadFlyer = () => {
    const canvas = flyerCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foody_cartel_flyer.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen bg-[#F8F7F2] dark:bg-[#121A16] text-neutral-800 dark:text-neutral-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-white dark:bg-[#1A231E] rounded-3xl shadow-xl border border-[#E8E6DF] dark:border-neutral-800 p-6 sm:p-10 space-y-7 animate-fadeIn">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Código QR Dinámico Oficial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-[#133829] dark:text-emerald-400">
            Tu Código QR de Foody
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            Personalizado con la mascota de Foody, fondo cálido, puntos redondeados y la estética oficial de GastronomIA.
          </p>
        </div>

        {/* Selector de Pestañas: Solo QR vs Cartel Flyer */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'qr'
                ? 'bg-[#133829] text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
                }`}
            >
              <QrCode className="w-4 h-4 text-[#D4AF37]" />
              <span>Código QR Solitario</span>
            </button>
            <button
              onClick={() => setActiveTab('flyer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'flyer'
                ? 'bg-[#133829] text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
                }`}
            >
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Cartel / Flyer Completo</span>
            </button>
          </div>
        </div>

        {/* Contenedor Visual del Canvas */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#FAF9F5] dark:bg-black/20 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          {/* Canvas 1: Solo el QR Cuadrado */}
          <div className={`${activeTab === 'qr' ? 'block' : 'hidden'} text-center space-y-4`}>
            <div className="relative inline-block rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#D4AF37]/30 max-w-[340px] sm:max-w-[380px]">
              <canvas
                ref={qrCanvasRef}
                className="w-full h-auto block"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>

            <div>
              <button
                onClick={handleDownloadQR}
                className="px-6 py-3 rounded-2xl bg-[#133829] hover:bg-[#1a4a37] text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 border border-[#D4AF37]/40 mx-auto"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>Descargar Código QR (PNG Alta Res)</span>
              </button>
            </div>
          </div>

          {/* Canvas 2: Cartel Flyer Completo */}
          <div className={`${activeTab === 'flyer' ? 'block' : 'hidden'} text-center space-y-4`}>
            <div className="relative inline-block rounded-3xl overflow-hidden shadow-2xl ring-4 ring-[#133829]/20 max-w-[340px] sm:max-w-[420px]">
              <canvas
                ref={flyerCanvasRef}
                className="w-full h-auto block"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>

            <div>
              <button
                onClick={handleDownloadFlyer}
                className="px-6 py-3 rounded-2xl bg-[#133829] hover:bg-[#1a4a37] text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 border border-[#D4AF37]/40 mx-auto"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>Descargar Cartel Completo (PNG Listo para Imprimir)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Datos del Enlace Dinámico */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-neutral-500 uppercase tracking-wider block text-[10px]">
              Destino Dinámico Vinculado
            </span>
            <code className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {redirectUrl}
            </code>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 transition flex items-center space-x-1.5 font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
            </button>

            <a
              href={redirectUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-700 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 transition flex items-center space-x-1.5 font-medium"
            >
              <span>Probar</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-xs font-semibold text-[#133829] dark:text-emerald-400 hover:underline inline-flex items-center space-x-1"
          >
            <span>← Volver a GastronomIA</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
