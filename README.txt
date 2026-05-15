CRYPT-STEG EXPO - Web estática + registro + desafíos interactivos + Supabase

ARCHIVOS PRINCIPALES
- index.html: landing, QR y formulario de registro.
- desafios.html: versión HTML de los desafíos con campos de respuesta.
- app.js: guarda el registro y conserva el ID en localStorage.
- desafios.js: guarda respuestas vinculadas al ID de registro.
- config.js: colocar URL y anon key de Supabase.
- supabase.sql: crea tablas y políticas.
- assets/: logos, PDFs y capturas PNG de los ejercicios.

PUBLICACIÓN EN GITHUB PAGES
1. Subir todos los archivos al repositorio.
2. Ir a Settings > Pages.
3. Source: Deploy from a branch.
4. Branch: main / root.
5. Guardar y abrir la URL publicada.

SUPABASE
1. Crear proyecto en Supabase.
2. Ir a SQL Editor.
3. Copiar y ejecutar todo el contenido de supabase.sql.
4. Ir a Project Settings > API.
5. Copiar Project URL y anon public key.
6. Editar config.js en GitHub y reemplazar:
   SUPABASE_URL: 'https://TU-PROYECTO.supabase.co'
   SUPABASE_ANON_KEY: 'TU-ANON-KEY'

FLUJO DE USO
1. El participante entra por QR.
2. Completa el registro en index.html.
3. La web guarda el ID de registro en el navegador.
4. El participante pasa a desafios.html.
5. Cada respuesta se guarda en expo_respuestas_desafios con registro_id.
6. Para consultar todo junto, usar la vista v_expo_respuestas_completas en Supabase.

IMPORTANTE
- La página pública solo inserta datos.
- Para una expo está bien usar anon key con RLS y políticas de insert.
- La política de lectura mínima está incluida para que el frontend pueda recuperar el ID recién creado. Si luego se quiere mayor seguridad, conviene crear una función RPC específica.
