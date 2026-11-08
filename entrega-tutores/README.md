# MenteClear

Trabajo final de grado: plataforma web de estimulación cognitiva y seguimiento del desempeño para personas adultas mayores.

Incluye 20 ejercicios en cinco categorías: Memoria, Lenguaje, Cálculo, Atención y reconocimiento, y Velocidad. Guarda resultados e historial, ajusta automáticamente la dificultad y permite consultar estadísticas y descargar informes PDF.

Es un prototipo académico. Los resultados describen el desempeño en los ejercicios y no constituyen una evaluación clínica.

## Probar la versión publicada

**https://menteclear.web.app**

No requiere instalar programas ni configurar Firebase. Abrir la dirección en un navegador actualizado y crear una cuenta desde «Registrarse», o ingresar con una cuenta ya creada. No se incluyen cuentas ni contraseñas compartidas en esta entrega.

El frontend está publicado en Firebase Hosting; el backend funciona en Google Cloud Run y utiliza Firebase Authentication y Cloud Firestore. El primer acceso puede demorar mientras inicia el backend.

## Descargar el código

Desde la carpeta de entrega de Google Drive, descargar `TFG-Alberione-codigo-fuente.zip` y descomprimirlo. Abrir la carpeta `MenteClear` con Visual Studio Code o una terminal. Esta copia puede utilizarse sin acceso a GitHub.

El ZIP incluye código, pruebas, dependencias declaradas y ejemplos de configuración. No incluye datos de usuarios, claves administrativas ni archivos de entorno privados.

El código también está disponible en https://github.com/PauloAlberione/TrabajoFinalSeminario. Si el repositorio es público, se puede consultar y descargar directamente. Si es privado, el autor debe invitar al tutor como colaborador y este debe aceptar la invitación con su cuenta; compartir solamente el enlace no otorga acceso.

Quienes tengan acceso pueden usar **Code → Download ZIP** y abrir la carpeta extraída, o clonar el repositorio:

```bash
git clone https://github.com/PauloAlberione/TrabajoFinalSeminario.git
cd TrabajoFinalSeminario
```

Si el repositorio es privado, el clon requiere autenticación de GitHub. No se deben incluir tokens de acceso en los comandos ni compartirlos en la entrega. El ZIP de Drive permite revisar el código sin una cuenta de GitHub.

## Requisitos para ejecutarlo localmente

- Node.js 22 actualizado: https://nodejs.org/
- pnpm 10.34.3, la versión indicada en `.mise.toml`.
- Conexión a Internet y un proyecto Firebase propio o uno de pruebas al que se tenga acceso autorizado.

Con Node.js instalado, se puede habilitar pnpm mediante Corepack:

```bash
corepack enable
corepack prepare pnpm@10.34.3 --activate
node --version
pnpm --version
```

Si Corepack no está disponible, seguir las instrucciones de instalación de https://pnpm.io/installation para el sistema operativo utilizado.

Todos los comandos siguientes se ejecutan desde la carpeta que contiene `package.json`.

### 1. Instalar las dependencias

```bash
pnpm install --frozen-lockfile
```

### 2. Preparar Firebase

La ejecución local completa también usa Firebase: no funciona como una aplicación sin conexión ni tiene los emuladores configurados. Para no compartir credenciales de producción, se recomienda crear un proyecto independiente desde https://console.firebase.google.com/.

En ese proyecto:

1. Habilitar **Authentication → Método de acceso → Correo electrónico/contraseña**.
2. En **Authentication → Configuración → Dominios autorizados**, agregar `localhost` si no aparece.
3. Configurar la política de contraseñas en modo obligatorio: mínimo ocho caracteres, una mayúscula y una minúscula. No se exigen números ni símbolos.
4. Crear una base **Cloud Firestore Standard**, en modo nativo, con el identificador `(default)`.
5. En **Configuración del proyecto → General**, registrar una aplicación web y copiar su configuración de Firebase.
6. Preparar credenciales de backend del mismo proyecto. Una opción es generar una clave desde **Configuración del proyecto → Cuentas de servicio → Firebase Admin SDK**. Guardar ese JSON fuera de la carpeta del código. La cuenta utilizada necesita permisos para trabajar con Firestore y administrar usuarios de Authentication; no se debe dar acceso al proyecto de producción para una prueba independiente.

No es necesario cargar un catálogo ni resultados de ejemplo: los ejercicios están definidos en el backend y cada usuario comienza sin historial.

### 3. Configurar el frontend

Crear `.env.local` en la raíz, tomando `.env.example` como referencia:

```dotenv
DEV_SERVER_HOST=localhost
PORT=5173
VITE_BACKEND_URL=http://127.0.0.1:8787
VITE_LOG_SERVER_URL=

VITE_FIREBASE_API_KEY=valor-de-tu-aplicacion-web
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_APP_ID=valor-de-tu-aplicacion-web
```

Esos cuatro valores `VITE_FIREBASE_*` son obligatorios y deben corresponder al proyecto elegido. `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_MEASUREMENT_ID` son opcionales.

La configuración web de Firebase es pública y distinta de una clave administrativa. **Nunca colocar un JSON de cuenta de servicio, una clave privada o credenciales del backend en variables `VITE_`**, porque se incorporan al código que recibe el navegador.

### 4. Configurar el backend

Crear `servidor/.env`, tomando `servidor/.env.example` como referencia:

```dotenv
BACKEND_PORT=8787
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
FIREBASE_PROJECT_ID=tu-proyecto
GOOGLE_APPLICATION_CREDENTIALS="/ruta/absoluta/segura/cuenta-de-servicio.json"
REMINDERS_ENABLED=false
```

Reemplazar el proyecto y la ruta por los propios. En Windows se puede usar una ruta como `C:/credenciales/cuenta-de-servicio.json`. No se debe compartir ese archivo ni incorporarlo al ZIP o al repositorio.

El backend usa las credenciales predeterminadas de Google: si el entorno ya tiene una identidad autorizada configurada, no es necesario definir `GOOGLE_APPLICATION_CREDENTIALS`. En Cloud Run se utiliza la identidad del servicio, sin distribuir una clave JSON.

### 5. Publicar las reglas e índices en el proyecto de pruebas

Con una cuenta autorizada en el proyecto propio:

```bash
pnpm dlx firebase-tools login
pnpm dlx firebase-tools deploy --only firestore:rules,firestore:indexes --project TU_PROYECTO
```

Reemplazar `TU_PROYECTO` por el ID propio. Indicarlo expresamente: `.firebaserc` conserva la referencia del despliegue original. Esperar a que los índices terminen de crearse antes de consultar el historial. Este comando no publica Hosting ni Cloud Run.

Las reglas bloquean el acceso directo del cliente a los documentos privados. El acceso a Firestore se realiza desde los repositorios del backend, después de verificar al usuario autenticado.

### 6. Iniciar la aplicación

Abrir **dos terminales** en la raíz y dejarlas ejecutándose.

Terminal 1, backend:

```bash
pnpm backend:dev
```

Terminal 2, frontend:

```bash
pnpm dev
```

Abrir **http://localhost:5173** y crear una cuenta desde el registro. El backend debe responder `{"ok":true}` en **http://127.0.0.1:8787/health**.

Ejecutar solamente `pnpm dev` no inicia el backend. Para detener los procesos, usar `Ctrl+C` en cada terminal. Reiniciarlos después de modificar la configuración; el script actual del backend también requiere reinicio si se cambia su código.

## Recorrido de prueba

1. Registrarse o iniciar sesión.
2. Entrar en **Ejercicios**, elegir una categoría y leer las instrucciones.
3. Comenzar una actividad, pausarla y reanudarla; terminarla y esperar la confirmación del resultado.
4. En **Progreso → Historial**, abrir el detalle del ejercicio y probar los filtros.
5. Consultar **Resumen**, **Actividad** y **Categorías**; descargar un PDF desde **Informes** o desde el historial.
6. En **Perfil**, modificar un dato permitido o una preferencia y comprobar que se conserva al volver a ingresar.
7. Cerrar sesión.

Hay cuatro niveles: Fácil, Normal, Difícil y Muy difícil. Cada categoría mantiene su propio nivel, que cambia automáticamente según dos resultados consecutivos y los criterios explicados en **Ayuda**. No hay controles para modificarlo manualmente.

## Pruebas y compilación

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm backend:build
pnpm build
```

`pnpm test` no necesita credenciales y omite por defecto las seis integraciones que usan Firebase real. La entrega incluye los archivos `*.prueba.ts` y sus auxiliares en `servidor/src/pruebas/`.

Para ejecutar también esas integraciones, configurar primero un proyecto Firebase de pruebas con sus índices y credenciales. Crean y eliminan cuentas y documentos temporales, y pueden generar consumo:

```bash
node --env-file=.env.local --env-file=servidor/.env --import tsx --test --test-concurrency=1 servidor/src/servicios/*.prueba.ts
```

Antes de ese comando, habilitar `RUN_FIREBASE_INTEGRATION=1` como variable del proceso o agregarla al `servidor/.env` local de pruebas. No se necesita para utilizar la aplicación.

## Configuración adicional

- Los ejercicios, historial, estadísticas, perfil y exportaciones no requieren un proveedor de correo adicional.
- La recuperación de contraseña utiliza Firebase Authentication. En un proyecto nuevo conviene verificar su plantilla de correo y realizar una recuperación con un correo propio.
- Los recordatorios programados necesitan proveedor Resend, dominio remitente, secretos y Cloud Scheduler. En esta entrega se dejan desactivados; no es necesario configurarlos para probar el resto del proyecto.
- La reanudación automática de eliminaciones pendientes tras un fallo requiere su tarea programada y la configuración de limpieza correspondiente. La eliminación interactiva solicita reautenticación.
- Las copias programadas de Firestore y los recursos de despliegue se configuran en Google Cloud; instalar el código localmente no los crea. Algunas de esas funciones requieren facturación habilitada y pueden generar cargos.
- El servidor local de registros es opcional. Con `VITE_LOG_SERVER_URL` vacío no se envían registros a ese servidor.

## Problemas frecuentes

- **No se puede cargar el perfil / `ERR_CONNECTION_REFUSED`:** comprobar que ambas terminales sigan activas y que `VITE_BACKEND_URL` coincida con el backend.
- **Firebase no configurado:** revisar los cuatro valores web obligatorios y reiniciar Vite.
- **Credenciales o permisos inválidos:** revisar la ruta al JSON, los permisos y que frontend y backend usen el mismo proyecto.
- **Error de índice en el historial:** publicar `firestore.indexes.json` y esperar su creación.
- **Puerto ocupado:** liberar el puerto o cambiarlo junto con `VITE_BACKEND_URL` y `FRONTEND_ORIGIN` según corresponda.

## Organización del código

- `src/`: interfaz React, páginas, componentes y servicios del frontend.
- `servidor/src/`: API Express, controladores, servicios y repositorios.
- `compartido/`: tipos, validaciones y estructuras utilizadas por ambos lados.
- `servidor/src/servicios/*.prueba.ts`: pruebas automatizadas.

El código propio utiliza nombres en español. Se conservan las claves persistidas, las rutas de la API y los nombres exigidos por las bibliotecas para mantener compatibilidad.

Referencias de configuración: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup), [Authentication con contraseña](https://firebase.google.com/docs/auth/web/password-auth) y [Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart).
