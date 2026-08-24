# MentesModernas Full Stack

Proyecto completo preparado para Visual Studio Code.

## Arquitectura

```text
React + Vite + TypeScript
        |
        +-- Supabase Auth
        |     +-- Google OAuth
        |     +-- Email OTP
        |
        +-- Supabase PostgreSQL
        |     +-- catálogo de tests
        |     +-- preguntas/versiones
        |     +-- usuarios
        |     +-- pagos
        |     +-- cupones
        |     +-- derechos de tests
        |     +-- resultados finales
        |     +-- contactos
        |     +-- visitas
        |     +-- administración
        |
        +-- Supabase Edge Functions
              +-- APIs públicas
              +-- pagos
              +-- resultado Premium
              +-- administración
              +-- OTP administrador
```

## Funcionalidades incluidas

### Público

- Landing MentesModernas con animación 3D del logo.
- Catálogo modular de tests.
- Orientación Vocacional:
  - Gratis: 35 preguntas, sin autenticación, sin persistencia de datos personales.
  - Premium: 72 preguntas, autenticación obligatoria y resultado persistido.
- Contacto.
- Registro anónimo de visitas.
- Diseño responsive.

### Autenticación clientes

No existe una pantalla separada de "Registro".

- Continuar con Google.
- Continuar mediante OTP por correo.
- La primera autenticación crea el usuario automáticamente.
- El usuario puede consultar resultados y tests pagados pendientes.

### Pago / QR

La interfaz contiene un QR placeholder deliberadamente vacío.

La función:

`supabase/functions/payment-check/index.ts`

actúa como adaptador temporal. Actualmente llama a `create_demo_entitlement` y SIEMPRE confirma el pago creando un pago `PAID`.

Cuando exista el API QR/callback real, debe reemplazarse solamente la lógica interna de esta función. El frontend no necesita cambiar.

### Regla de consumo del test

1. Pago confirmado -> `test_entitlements.status = AVAILABLE`.
2. El usuario puede comenzar el test.
3. No se guarda avance temporal en PostgreSQL.
4. Si abandona el test, el entitlement continúa `AVAILABLE`.
5. Al finalizar, `finalize_premium_evaluation` inserta el resultado final y cambia el entitlement a `CONSUMED` en la misma transacción.

### Cupones

Incluye:

- PERCENTAGE
- FIXED_AMOUNT
- FREE
- vigencia
- máximo de usos
- contador de usos
- producto opcional
- redenciones

Se incluye `LANZAMIENTO100` para pruebas.

### Administración

Ruta:

`/admin/login`

Modelo de seguridad:

1. El administrador escribe su correo.
2. `admin-request-otp` verifica el correo sin revelar públicamente si existe.
3. Se envía un OTP de 6 dígitos al correo.
4. En la segunda pantalla introduce contraseña + OTP.
5. La contraseña se valida contra un hash bcrypt generado con `pgcrypto`.
6. El OTP vence en 10 minutos y solo puede utilizarse una vez.
7. `admin-verify` emite un JWT administrativo de 4 horas.
8. Las APIs administrativas verifican ese JWT.

La contraseña NO se almacena cifrada de forma reversible. Se almacena hasheada.

Panel incluido:

- Dashboard.
- Visitas.
- Usuarios / métricas generales.
- Pagos.
- Mensajes recibidos.
- Cupones.
- Editor de contenido.
- Cambio de logo.
- Cambio de contraseña.

### Aprobar comprobantes de pago

1. Ingresa en `/admin/login` con tu cuenta administrativa.
2. Abre la sección **Pagos** del menú lateral.
3. En **Comprobantes pendientes**, pulsa **Ver comprobante**.
4. Después de verificar monto, nombre y referencia, pulsa **Aprobar pago**.
5. La aprobación habilita automáticamente el test Premium para el usuario y le envía una confirmación por correo.

Cuando un usuario sube un comprobante, todos los administradores activos reciben un aviso por correo. El envío utiliza los mismos secretos `RESEND_API_KEY` y `RESEND_FROM` configurados para el acceso administrativo.

## 1. Requisitos locales

- Node.js 20+.
- npm.
- Visual Studio Code.
- Supabase CLI para migrations/functions.
- Docker únicamente si deseas ejecutar Supabase localmente.

## 2. Instalar frontend

```bash
npm install
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Editar `.env`:

```env
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
VITE_SITE_URL=http://localhost:5173
```

La publishable key puede vivir en el frontend. NUNCA colocar service_role, secret keys, contraseña PostgreSQL ni ADMIN_JWT_SECRET en Vite.

Ejecutar:

```bash
npm run dev
```

Abrir:

`http://localhost:5173`

## 3. Base de datos

Puedes usar Supabase CLI:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O copiar el contenido de:

`supabase/migrations/202608070001_initial_schema.sql`

en `SQL Editor` de Supabase y ejecutarlo.

La migración:

- activa `pgcrypto`;
- crea las tablas;
- crea RLS;
- crea funciones transaccionales;
- carga 35 preguntas gratuitas;
- carga 72 preguntas Premium;
- crea el catálogo futuro;
- crea el bucket público `branding`.

## 4. Crear el primer administrador

Abrir:

`scripts/create_admin.sql`

Cambiar:

- correo;
- contraseña;
- nombre.

Ejecutar en Supabase SQL Editor.

Después eliminar cualquier copia que contenga la contraseña real.

## 5. Secrets de Edge Functions

Generar dos secretos aleatorios fuertes, por ejemplo con un password manager.

Configurar:

```bash
supabase secrets set ADMIN_JWT_SECRET="UN_SECRETO_ALEATORIO_DE_MAS_DE_32_CARACTERES"
supabase secrets set ADMIN_OTP_PEPPER="OTRO_SECRETO_ALEATORIO"
supabase secrets set SITE_ORIGIN="http://localhost:5173"
```

Para envío real del OTP administrativo se configuró Resend:

```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set RESEND_FROM="MentesModernas <seguridad@tudominio.com>"
```

Estos secretos también se usan para avisar al administrador sobre nuevos comprobantes y al usuario cuando su pago es aprobado o rechazado.

Para desarrollo sin correo puedes habilitar temporalmente:

```bash
supabase secrets set ADMIN_DEV_MODE="true"
```

En este modo `admin-request-otp` devuelve `devToken` en el JSON. NO usarlo en producción.

## 6. Desplegar Edge Functions

```bash
supabase functions deploy admin-request-otp
supabase functions deploy admin-verify
supabase functions deploy admin-api
supabase functions deploy admin-upload-logo
supabase functions deploy public-contact
supabase functions deploy public-analytics
supabase functions deploy payment-check
supabase functions deploy payment-submit
supabase functions deploy submit-premium-result
```

## 7. Configurar Google

En Supabase:

`Authentication -> Providers -> Google`

Configura el Google Client ID y Client Secret.

En Google Cloud configura las URLs que Supabase indique y agrega en Auth URL Configuration:

- `http://localhost:5173`
- tu dominio de producción.

El frontend usa `supabase.auth.signInWithOAuth({ provider: 'google' })`.

## 8. Login por correo del cliente

Se implementa mediante Supabase Email OTP.

Configura plantillas y SMTP cuando pases a producción.

## 9. Pago real futuro

Actualmente:

```text
QR vacío
  -> usuario pulsa continuar
  -> payment-check
  -> paid = true
  -> entitlement AVAILABLE
```

Futuro:

```text
Frontend solicita QR
  -> Edge Function genera QR con API bancaria
  -> payments=PENDING
  -> callback bancario valida firma/transacción
  -> payments=PAID
  -> entitlement AVAILABLE
```

La tabla `payments` ya contiene:

- transaction_reference
- qr_payload
- callback_request
- callback_response
- status
- paid_at

## 10. Publicación gratuita sugerida

Frontend:

- Cloudflare Pages.

Backend/base/auth:

- Supabase.

Flujo típico de Cloudflare Pages:

```bash
npm run build
```

Publicar la carpeta:

`dist`

Variables de ambiente del build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`

Después cambiar:

`SITE_ORIGIN=https://tudominio.com`

en los secrets de Edge Functions.

## 11. Tests futuros incluidos en catálogo

- `VOCATIONAL` — activo.
- `LEARNING_STYLE` — próximamente.
- `PERSONAL_STRENGTHS` — próximamente.

La arquitectura utiliza `test_types`, `test_versions`, `test_questions` y `test_products`, por lo que agregar un test nuevo no requiere una base separada.

## 12. Advertencia profesional

El instrumento vocacional se presenta como orientación de intereses inspirada en RIASEC. No debe venderse como diagnóstico psicológico clínico ni como reproducción de un test comercial protegido. Antes de usarlo profesionalmente a escala, las preguntas y reglas de interpretación deberían ser revisadas y validadas por un profesional competente.

## 13. Archivos principales

```text
src/
  components/
  pages/
  services/
  lib/
supabase/
  migrations/
  functions/
scripts/
```

## 14. Seguridad

- RLS activo.
- `service_role` solo en Edge Functions.
- contraseña admin con bcrypt/pgcrypto.
- OTP admin de un solo uso.
- JWT administrativo separado del JWT de usuarios.
- tablas administrativas sin políticas públicas.
- resultados Premium visibles únicamente por su propietario.
- preguntas Premium se entregan únicamente a usuarios autenticados con entitlement disponible.
- no hay persistencia temporal de respuestas Premium.

Antes de producción se recomienda agregar:
- CAPTCHA/Turnstile en contacto y OTP.
- rate limiting perimetral.
- política de privacidad.
- consentimiento para menores.
- términos de uso.
- backup y monitoreo.
