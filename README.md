# MentesModernas

Plataforma de orientación y autoexploración: https://mentesmodernas.lat.

La aplicación utiliza Firebase Authentication para las cuentas, Firestore para los datos y Cloudflare Workers para la web y la API. Los comprobantes privados y los logos se guardan en Cloudflare R2. No necesita Supabase para funcionar.

El test vocacional IA 2026 tiene 48 preguntas originales, informe de afinidades y preparación, fuentes internacionales 2025–2026 y precio inicial de 45 BOB. Orienta sobre rutas con mejores perspectivas frente a la automatización; no garantiza la supervivencia de una profesión ni constituye una prueba psicométrica validada. El precio vigente se modifica en **Administrador → Configuración de pagos y tests**.

## Configuración

`mentesmodernas.config` contiene la configuración pública del sitio, Firebase, servicios, producto y nombres de secretos. `npm run build` genera `src/lib/firebase-config.json` desde ese archivo. El precio inicial documentado no sobrescribe el precio vigente en Firestore.

Los valores privados se configuran mediante `wrangler secret put NOMBRE`. Para desarrollo se admite `.dev.vars`, excluido de Git. Los nombres requeridos están en `mentesmodernas.config`. Nunca colocar la cuenta de servicio, claves bancarias o claves de correo en variables `VITE_`.

La cuenta de servicio requiere `roles/datastore.user` y `roles/firebaseauth.admin`. Las reglas Firestore deniegan el acceso directo desde clientes; la API verifica Firebase ID tokens, usuario activo y propiedad de los datos. El administrador exige una sesión Google y un correo habilitado en `admin_users`.

## Desarrollo y despliegue

Requiere Node.js 24 y acceso a los proyectos Firebase/Cloudflare correspondientes.

```sh
npm ci
npm run check
npm test
npm run build
npm run dev:api
```

`dev:api` sirve el build y la API. Para desarrollar solo la interfaz se puede usar `npm run dev`; configurar un proxy de `/api` hacia el Worker local si se necesita el backend.

```sh
npm run deploy
npx firebase-tools deploy --only firestore --project mentesmodernas-arpal
```

El dominio personalizado se conserva en Cloudflare. El proyecto Firebase es `mentesmodernas-arpal`; Firestore está en `us-west2`. R2 usa el bucket `mentesmodernas-private`, sin acceso público. Los comprobantes se consultan mediante enlaces firmados que duran hasta 15 minutos.

## Pruebas de integración

Se ejecutan explícitamente contra la versión de prueba y crean/eliminan registros QA. Requieren una cuenta de servicio privada fuera del repositorio.

```powershell
$env:MM_FIREBASE_CREDENTIAL_FILE='ruta-privada/cuenta-de-servicio.json'
$env:MM_VERIFY_BASE_URL='https://mentesmodernas-firebase-preview.ssadm.workers.dev'
npm run test:firebase
npm run test:payments
```

Se verifican autenticación, autorización, reglas Firestore, canjes concurrentes, consumo de accesos, reintentos de envío, historial, precios del servidor y confirmaciones bancarias. El test de pagos simula el banco y el correo: no transfiere dinero ni envía mensajes reales.

## Estructura

- `src/`: interfaz React.
- `server/`: API Worker, autenticación, Firestore, transacciones y archivos.
- `shared/`: cuestionario y cálculo del informe IA 2026.
- `scripts/`: configuración y verificaciones.
- `firestore.rules`: acceso directo denegado; permisos concedidos exclusivamente por la API.
- `legacy/`: código histórico de Supabase para referencia y recuperación; excluido del build.
- `social-media/`: recursos y textos preparados para redes.

## Operación

Las sesiones antiguas de Supabase no se reutilizan: cada persona debe volver a ingresar una vez. Se mantienen sus identificadores, resultados, pagos, cupones y accesos. Las contraseñas existentes se importan con BCRYPT; Google y el acceso por código de correo siguen disponibles.

El catálogo público tiene una caché de hasta 60 segundos. Los cobros siempre usan el precio actual del servidor. Un pago QR se aprueba únicamente al verificarlo con la API bancaria. Los reintentos de finalización comparten un identificador y no consumen otro acceso.

La arquitectura conserva los planes actuales sin habilitar Firebase Storage ni Cloud Functions. Se aplican los límites de los planes gratuitos de Firebase y Cloudflare; revisar su uso si crece el tráfico. Las copias con datos personales y credenciales se mantienen fuera de GitHub.
