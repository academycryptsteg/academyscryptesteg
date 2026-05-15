CRYPT-STEG EXPO - Página estática con formulario + QR + Supabase

ARCHIVOS PRINCIPALES
- index.html: página principal.
- styles.css: estilos visuales.
- app.js: lógica del formulario, QR y envío a Supabase.
- config.js: colocar Project URL y anon public key de Supabase.
- supabase.sql: script para crear la tabla y la política de inserción pública.
- assets/: logos y PDFs.

PASOS PARA SUBIR A GITHUB PAGES
1) Crear un repositorio, por ejemplo: crypt-steg-expo.
2) Subir todos los archivos de esta carpeta al repositorio.
3) Entrar a Settings > Pages.
4) En Build and deployment elegir: Deploy from a branch.
5) Branch: main / root.
6) Guardar.
7) La página quedará en una URL similar a:
   https://USUARIO.github.io/crypt-steg-expo/

PASOS PARA SUPABASE
1) Crear proyecto en Supabase.
2) Ir a SQL Editor.
3) Pegar y ejecutar supabase.sql.
4) Ir a Project Settings > API.
5) Copiar Project URL y anon public key.
6) Pegarlas en config.js.

IMPORTANTE
El QR se genera automáticamente con la URL real donde esté abierta la página.
Cuando esté publicada en GitHub Pages, abrir la página y el QR ya apuntará al formulario.
