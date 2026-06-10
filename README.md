# 🔍 ScanVision — Escáner Inteligente de Documentos

<div align="center">

**Escanea documentos y transcribe texto de imágenes con IA — powered by Google Gemini**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0-Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

</div>

---

## ✨ Características

- 📷 **Escáner en tiempo real** — accede a la cámara del dispositivo con visor de alineación animado
- 🤖 **Transcripción con IA** — extrae texto de imágenes usando Google Gemini 2.0 Flash
- 📋 **Copiar y descargar** — copia la transcripción al portapapeles o descarga la captura como JPG
- 🎨 **UI premium** — dark mode con glassmorphism, animaciones fluidas y micro-interacciones
- ⌨️ **Atajos de teclado** — `Espacio` / `Enter` para capturar, `Escape` para volver
- 📱 **Responsive** — funciona en desktop y móvil

---

## 🛠️ Tech Stack

| Tecnología | Uso |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework full-stack (App Router) |
| [React 19](https://react.dev/) | UI reactiva |
| [TypeScript](https://typescriptlang.org/) | Tipado estático |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utilidades CSS |
| [Google Gemini API](https://ai.google.dev/) | OCR / transcripción de imágenes |

---

## 🚀 Comenzar

### Requisitos previos

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Una [API key de Google Gemini](https://aistudio.google.com/apikey)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/image-scanner.git
cd image-scanner/frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

### Variables de entorno

Crea un archivo `.env.local` en `/frontend` con:

```env
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

> **Nota:** Para acceder a la cámara en dispositivos móviles, necesitas HTTPS. En desarrollo local, `localhost` funciona sin HTTPS.

---

## ☁️ Deploy en Vercel

### 1. Conectar repositorio

1. Ve a [vercel.com](https://vercel.com/) e inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub

### 2. Configurar proyecto

| Setting | Valor |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `pnpm run build` |
| **Install Command** | `pnpm install` |

### 3. Variables de entorno

En la sección **Environment Variables** de Vercel, agrega:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Tu API key de Google Gemini |

### 4. Deploy

Click en **Deploy** y espera a que termine. ¡Listo! 🎉

---

## 📁 Estructura del proyecto

```
frontend/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts        # Endpoint de transcripción (Gemini)
│   ├── globals.css             # Sistema de diseño y animaciones
│   ├── layout.tsx              # Layout raíz con metadata SEO
│   └── page.tsx                # Página principal
├── components/
│   ├── Escaner.tsx             # Componente de escáner con cámara y transcripción
│   └── Header.tsx              # Header con logo y estado
├── .env.local                  # Variables de entorno (no se sube a git)
└── package.json
```

---

## 🔑 API

### `POST /api/transcribe`

Transcribe texto de una imagen usando Gemini.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "text": "Texto transcrito de la imagen..."
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 400 | Imagen no proporcionada o formato inválido |
| 429 | Demasiadas solicitudes (rate limit de Gemini) |
| 500 | Error interno al procesar la imagen |

---

## 📜 Licencia

MIT — ver [LICENSE](./LICENSE) para más detalles.
