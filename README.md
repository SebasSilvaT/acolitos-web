# Gestión de Acólitos - Proyecto Web

Este proyecto es una aplicación web para la gestión automática de horarios de misas y asistencia de acólitos, conectada a Google Sheets como base de datos.

## 🚀 Instalación en Nuevo Equipo

Al mover este proyecto a otro computador, sigue estos pasos estrictamente para que vuelva a funcionar:

### 1. Prerrequisitos
- Tener instalado **Node.js** (versión 18 o superior).
- Tener acceso a la cuenta de Google Cloud donde se crearon las credenciales.

### 2. Configuración del Entorno (CRÍTICO)
El archivo `.env.local` **NO se guarda en el proyecto** por seguridad. Debes crearlo manualmente en el nuevo equipo:

1. Crea un archivo llamado `.env.local` en la carpeta raíz (`acolitos-web`).
2. Copia el contenido del archivo `env-example.txt`.
3. Rellena los datos:
   - `GOOGLE_SHEET_ID`: El ID de tu hoja de cálculo (búscalo en la URL del navegador).
   - `GOOGLE_CLIENT_EMAIL`: El email de la cuenta de servicio (del JSON).
   - `GOOGLE_PRIVATE_KEY`: La clave privada completa (del JSON).

### 3. Instalación de Dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 4. Verificar Conexión
Para confirmar que conecta con Google Sheets, ejecuta:
```bash
npm run dev
```
Luego abre `http://localhost:3000/api/setup` en tu navegador. Deberías ver un mensaje de éxito `{"success":true}`.

---

## 🚧 Tareas Pendientes (Roadmap de Desarrollo)

Si vas a continuar el desarrollo, este es el estado actual y lo que falta por programar:

### ✅ Hecho
- [x] Inicialización del proyecto (Next.js + Tailwind).
- [x] Conexión con Google Sheets (Librería configurada).
- [x] Estructura de Base de Datos (Pestañas Users, Config, Schedule creadas).
- [x] Interfaz de Administrador (Versión Visual con datos falsos/mock).
- [x] Servicio de lectura de datos (`src/lib/data.ts`).
- [x] Conectar Interfaz con Datos Reales (API Routes `/api/users`, `/api/schedule`).
- [x] Implementar Algoritmo de Horarios (`/api/generate` básico implementado).
- [x] Interfaz Móvil (Acólitos) (`/my-schedule` creada).
- [x] Control de Asistencia (Implmentado en Dashboard).

### 📝 Por Hacer (Faltante)
- [ ] Refinar algoritmo de horarios (optimización y balanceo).
- [ ] Autenticación real (si se requiere más seguridad).


---

## Estructura de Carpetas Clave
- `src/lib/googleSheets.ts`: Configuración de la conexión.
- `src/lib/data.ts`: Funciones para leer/escribir datos reales.
- `src/lib/mockData.ts`: Datos de prueba (borrar cuando se complete la integración).
- `src/components/AdminDashboard.tsx`: Panel principal.
- `scripts/`: Scripts de utilidad para inicializar la BD.
