# 👶🍼 Baby Shower Corporativo | Operación Pañales

Aplicación web interactiva temática de **"Un Jefe en Pañales" (The Boss Baby)** diseñada para la asignación y gestión de regalos en tiempo real para el Baby Shower, impulsada por **Vite** y **Supabase**.

---

## ✨ Características

- 👔 **Diseño Temático Premium**: Estética inspirada en Baby Corp con tipografía Plus Jakarta Sans, animaciones suaves, efectos de confeti y modo corporativo.
- 🎯 **Ruleta de Regalos Interactiva**: Dinámica visual con animaciones y sonido de giro para asignar regalos de manera divertida.
- 🗄️ **Base de Datos en Tiempo Real (Supabase)**: Control de stock por regalo, validación de invitados para evitar duplicados y registro en vivo.
- 📱 **100% Responsivo**: Adaptado perfectamente para móviles, tablets y computadoras de escritorio.
- 🛡️ **Seguridad y Validación**: Manejo seguro de credenciales con variables de entorno y soporte RLS (Row Level Security).

---

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 moderno (Vanilla CSS con diseño responsivo), JavaScript (ES Modules)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Efectos**: `canvas-confetti`

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/Santiago-Arroyave/BabyShower.git
cd BabyShower
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Base de datos
Ejecuta el script SQL ubicado en [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de tu proyecto en Supabase para crear las tablas necesarias (`regalos` e `invitados`).

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 6. Construir para producción
```bash
npm run build
```

---

## 📂 Estructura del Proyecto

```text
├── public/                 # Archivos estáticos e imágenes (Jefe en Pañales)
├── src/
│   ├── components/         # Componentes modulares
│   ├── services/           # Lógica y conexión con Supabase (regalosService.js)
│   ├── styles/             # Hojas de estilo CSS
│   ├── app.js              # Controlador principal de la UI
│   └── supabaseClient.js   # Inicialización del cliente Supabase
├── supabase/
│   └── schema.sql          # Esquema de base de datos y políticas RLS
├── index.html              # Página principal
├── package.json            # Scripts y dependencias
└── README.md               # Documentación del proyecto
```

---

## 👨‍💻 Autor

- **Santiago Arroyave** - [@Santiago-Arroyave](https://github.com/Santiago-Arroyave)
