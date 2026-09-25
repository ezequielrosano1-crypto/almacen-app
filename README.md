# Almacén — Punto de venta

App de punto de venta, stock y caja automática para un almacén de barrio.
Hecha con React + Tailwind CSS, empaquetada con Vite y lista para
instalarse como app (PWA) en un celular.

## Cómo guarda los datos

Los productos, ventas y el estado de la caja se guardan en el
**almacenamiento del navegador** (localStorage) del dispositivo donde se
usa. Eso significa:

- Los datos **no se pierden** al cerrar o recargar la app.
- Los datos **no se comparten** entre dispositivos: si abrís la app desde
  otro celular o computadora, vas a ver datos vacíos/de ejemplo, no los
  mismos productos ni ventas.
- Es ideal para un solo local con un solo dispositivo en el mostrador.

Si más adelante querés usarla desde varios dispositivos o varios locales al
mismo tiempo, hay que migrar el guardado a una base de datos real (por
ejemplo Supabase) — es un cambio de arquitectura, no de diseño, así que se
puede hacer sin rehacer la app.

## Desplegar gratis en Vercel (recomendado)

1. Subí esta carpeta completa a un repositorio nuevo en GitHub.
2. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta
   de GitHub (gratis, sin tarjeta).
3. "Add New… → Project", elegí este repositorio.
4. Vercel detecta que es un proyecto Vite automáticamente. No hay que tocar
   nada — dale a "Deploy".
5. En 1-2 minutos te da una URL pública (algo como
   `tu-almacen.vercel.app`).

Cada vez que subas un cambio al repositorio de GitHub, Vercel vuelve a
publicar la app sola, en un minuto.

## Instalarla en el celular

1. Abrí la URL de Vercel desde Chrome en el celular.
2. Tocá el menú (⋮) → "Agregar a pantalla de inicio" / "Instalar app".
3. Te queda un ícono normal en el celular. Se abre a pantalla completa, sin
   la barra del navegador.

## Correrla en tu computadora (opcional, para probar antes de subir)

Necesitás tener [Node.js](https://nodejs.org) instalado (versión 18 o
superior). Después, en esta carpeta:

```bash
npm install
npm run dev
```

Te va a dar una URL local (`http://localhost:5173`) para abrir en el
navegador y probar la app antes de publicarla.


