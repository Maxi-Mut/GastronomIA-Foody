import './globals.css';

export const metadata = {
  title: 'GastronomIA — Asistente Gastronómico con Foody (CABA & GBA)',
  description: 'Descubrí los mejores sabores, restaurantes y rutas gastronómicas en Buenos Aires y Gran Buenos Aires con Foody.',
  icons: {
    icon: '/foody_favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
