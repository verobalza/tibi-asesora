# Tibi Asesora (Frontend)

Sitio web estático escrito en TypeScript y compilado a `public/` para publicación rápida sin bundler.

## Estructura

```
tibi-asesora/
├── public/           # Salida compilada lista para servir
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   └── assets/
│       ├── logo.png
│       └── FONDO_inicio.jpg
├── src/              # Código fuente TypeScript
│   ├── main.ts
│   └── firebase/
│       ├── config.ts
│       └── submitCitas.ts
├── Playfair_Display/ # Fuentes locales
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run build`: compila TypeScript de `src/` a `public/`.
- `npm run watch`: compila de forma incremental al guardar (útil en desarrollo).

## Flujo de trabajo

1) Instala dependencias: `npm install`
2) Ejecuta `npm run watch` mientras editas archivos en `src/`.
3) Sirve `public/` (por ejemplo con una extensión de Live Server) para ver el sitio.

## Firebase

En `src/firebase/config.ts` coloca tu configuración real de Firebase. ` hay un stub listo para conectar con Firestore o Realtime Database; sustituye la lógica de ejemplo por llamadas reales.

