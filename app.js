const cfg = window.CRYPTSTEG_CONFIG || {};
const form = document.getElementById('registroForm');
const msg = document.getElementById('formMsg');
const registroGuardado = document.getElementById('registroGuardado');

// Actualiza visualmente los rangos 0-10
form.querySelectorAll('input[type="range"]').forEach(range => {
  const output = range.parentElement.querySelector('output');
  const update = () => output.textContent = range.value;
  range.addEventListener('input', update);
  update();
});

// QR automático con la URL donde esté publicada la página
const currentUrl = window.location.href.split('#')[0];
document.getElementById('qrUrl').textContent = currentUrl;
new QRCode(document.getElementById('qrcode'), {
  text: currentUrl,
  width: 240,
  height: 240,
  correctLevel: QRCode.CorrectLevel.H
});

function hasSupabaseConfig(){
  return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
}

let supabaseClient = null;
if(hasSupabaseConfig()){
  supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

function getPayload(){
  const fd = new FormData(form);
  return {
    nombre: String(fd.get('nombre') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    institucion: String(fd.get('institucion') || '').trim(),
    rol: String(fd.get('rol') || '').trim(),
    conocimiento_asimetrica: Number(fd.get('conocimiento_asimetrica') || 0),
    conocimiento_simetrica: Number(fd.get('conocimiento_simetrica') || 0),
    conocimiento_pqc: Number(fd.get('conocimiento_pqc') || 0),
    conocimiento_esteganografia: Number(fd.get('conocimiento_esteganografia') || 0),
    interes: String(fd.get('interes') || '').trim(),
    quiere_material: fd.get('quiere_material') === 'on',
    acepta_contacto: fd.get('acepta_contacto') === 'on',
    comentarios: String(fd.get('comentarios') || '').trim()
  };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'form-msg';
  msg.textContent = 'Enviando registro...';

  const payload = getPayload();
  if(!payload.nombre || !payload.email){
    msg.className = 'form-msg bad';
    msg.textContent = 'Completá nombre y correo electrónico.';
    return;
  }

  try{
    if(!supabaseClient){
      console.warn('Supabase no configurado. Payload de prueba:', payload);
      msg.className = 'form-msg ok';
      msg.textContent = 'Formulario listo. Falta configurar Supabase en config.js para guardar registros reales.';
      return;
    }

    const { data, error } = await supabaseClient
      .from(cfg.TABLE_NAME || 'expo_registros')
      .insert(payload)
      .select('id,nombre,email')
      .single();

    if(error) throw error;

    localStorage.setItem('cryptsteg_registro', JSON.stringify({
      id: data.id,
      nombre: data.nombre,
      email: data.email
    }));

    form.reset();
    form.querySelectorAll('input[type="range"]').forEach(range => {
      range.value = 0;
      range.parentElement.querySelector('output').textContent = '0';
    });
    msg.className = 'form-msg ok';
    msg.textContent = 'Registro enviado correctamente. ¡Gracias por participar!';
    if(registroGuardado){
      registroGuardado.hidden = false;
      registroGuardado.innerHTML = `<strong>Registro guardado.</strong><br><a class="btn ghost small" href="desafios.html">Continuar a los desafíos interactivos</a>`;
    }
  }catch(error){
    console.error(error);
    msg.className = 'form-msg bad';
    msg.textContent = 'No se pudo guardar el registro. Revisá la configuración de Supabase.';
  }
});


// Contacto para sponsors y voluntarios
const contactDialog = document.getElementById('contactDialog');
const contactForm = document.getElementById('contactForm');
const contactMsg = document.getElementById('contactMsg');
const contactTipo = document.getElementById('contactTipo');
const contactTitle = document.getElementById('contactTitle');

document.querySelectorAll('[data-open-contact]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tipo = btn.dataset.openContact || 'sponsor';
    contactTipo.value = tipo;
    contactTitle.textContent = tipo === 'voluntario' ? 'Anotarme como voluntario' : 'Quiero ser sponsor';
    contactMsg.textContent = '';
    contactMsg.className = 'form-msg';
    if(contactDialog && typeof contactDialog.showModal === 'function') contactDialog.showModal();
  });
});

document.querySelector('.dialog-close')?.addEventListener('click', () => contactDialog?.close());
contactDialog?.addEventListener('click', (e) => {
  if(e.target === contactDialog) contactDialog.close();
});

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(contactForm);
  const payload = {
    tipo: String(fd.get('tipo') || 'sponsor').trim(),
    nombre: String(fd.get('nombre') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    organizacion: String(fd.get('organizacion') || '').trim(),
    telefono: String(fd.get('telefono') || '').trim(),
    mensaje: String(fd.get('mensaje') || '').trim(),
    page_url: window.location.href,
    user_agent: navigator.userAgent
  };

  if(!payload.nombre || !payload.email){
    contactMsg.className = 'form-msg bad';
    contactMsg.textContent = 'Completá nombre y correo electrónico.';
    return;
  }

  contactMsg.className = 'form-msg';
  contactMsg.textContent = 'Enviando contacto...';

  try{
    if(!supabaseClient){
      console.warn('Supabase no configurado. Contacto:', payload);
      contactMsg.className = 'form-msg ok';
      contactMsg.textContent = 'Contacto listo. Falta configurar Supabase para guardarlo.';
      return;
    }

    const { error } = await supabaseClient
      .from(cfg.CONTACTOS_TABLE || 'expo_contactos_sponsor')
      .insert(payload);

    if(error) throw error;
    contactForm.reset();
    contactMsg.className = 'form-msg ok';
    contactMsg.textContent = 'Gracias. Recibimos tus datos y te vamos a contactar.';
    setTimeout(() => contactDialog?.close(), 1200);
  }catch(error){
    console.error(error);
    contactMsg.className = 'form-msg bad';
    contactMsg.textContent = 'No se pudo guardar el contacto. Revisá la configuración de Supabase.';
  }
});
