# Migración a Firebase — 8 de septiembre de 2026

La versión pública de https://mentesmodernas.lat utiliza Firebase Authentication y Firestore, con API/web en Cloudflare Workers y archivos privados en R2. Versión publicada del Worker: `7d4fb1cf-eaff-4a5f-a3d5-dc845a0118f3`.

La comprobación de integridad comparó 891 registros migrados, las 6 cuentas y los 3 comprobantes (SHA-256 de los archivos). Se conservaron los identificadores de usuarios y las relaciones de resultados, pagos y accesos.

Los 2 tokens de acceso administrativo antiguos no se importaron. Las contraseñas administrativas antiguas tampoco se copian a Firestore: el administrador utiliza Google y valida el correo autorizado en cada solicitud. Los hashes BCRYPT de las cuentas de usuarios se importaron directamente en Firebase Authentication.

Supabase permanece como copia de recuperación, con las tablas públicas en solo lectura mediante `legacy/freeze-supabase.sql`. La aplicación activa no carga su SDK ni consulta sus servicios. El código anterior se conserva en `legacy/`; las copias de datos y las claves no están en GitHub.

Validaciones realizadas: compilación TypeScript de interfaz y servidor, cinco pruebas del cuestionario, autenticación Firebase por contraseña, reglas que bloquean lecturas directas, aislamiento entre cuentas, canjes simultáneos, finalización idempotente, historial gratuito, precios del servidor, confirmaciones bancarias concurrentes y verificación/reutilización de códigos de correo. Banco y correo se simularon en las pruebas que generarían movimientos o mensajes. El catálogo y el precio de 45 BOB se verificaron también en el dominio público.

La automatización llegó al selector Google del navegador, pero no completó la selección de cuenta en su ventana emergente. La comprobación visual del acceso administrativo requiere que el propietario seleccione su cuenta. Se habilitó Google en Firebase y se conservaron las identidades Google de las cuentas importadas.

Para volver excepcionalmente a la versión anterior, primero detener escrituras en la versión nueva y reconciliar cualquier dato generado en Firebase. Solo entonces aplicar `legacy/unfreeze-supabase.sql` y restaurar el despliegue anterior. No ejecutar el rollback directamente sobre datos que ya hayan recibido nuevos pagos o evaluaciones.
