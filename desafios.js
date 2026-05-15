const cfg = window.CRYPTSTEG_CONFIG || {};
const registroEstado = document.getElementById('registroEstado');

function hasSupabaseConfig(){
  return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
}

let supabaseClient = null;
if(hasSupabaseConfig()){
  supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

function getRegistro(){
  try{
    return JSON.parse(localStorage.getItem('cryptsteg_registro') || 'null');
  }catch(e){
    return null;
  }
}

function renderRegistroEstado(){
  const registro = getRegistro();
  if(registro && registro.id){
    registroEstado.className = 'notice ok';
    registroEstado.innerHTML = `<strong>Registro activo:</strong> ${registro.nombre || 'Participante'} · ID ${registro.id}`;
  }else{
    registroEstado.className = 'notice warn';
    registroEstado.innerHTML = '<strong>Importante:</strong> primero conviene completar el registro. Si no hay ID activo, la respuesta no podrá vincularse al participante.';
  }
}

renderRegistroEstado();

function setMsg(form, type, text){
  const msg = form.querySelector('.form-msg');
  msg.className = `form-msg ${type || ''}`;
  msg.textContent = text;
}

function buildPayload(form){
  const registro = getRegistro();
  const fd = new FormData(form);
  return {
    registro_id: registro?.id || null,
    desafio: form.dataset.desafio,
    respuesta: String(fd.get('respuesta') || '').trim(),
    clave: String(fd.get('clave') || '').trim(),
    observaciones: String(fd.get('observaciones') || '').trim(),
    user_agent: navigator.userAgent,
    page_url: window.location.href
  };
}

document.querySelectorAll('.challenge-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = buildPayload(form);

    if(!payload.registro_id){
      setMsg(form, 'bad', 'Falta el registro del participante. Primero completá el formulario de registro.');
      return;
    }
    if(!payload.respuesta){
      setMsg(form, 'bad', 'Escribí una respuesta antes de guardar.');
      return;
    }

    setMsg(form, '', 'Guardando respuesta...');

    try{
      if(!supabaseClient){
        console.warn('Supabase no configurado. Payload de prueba:', payload);
        setMsg(form, 'ok', 'Respuesta lista. Falta configurar Supabase para guardarla en la base.');
        return;
      }

      const { error } = await supabaseClient
        .from(cfg.RESPUESTAS_TABLE || 'expo_respuestas_desafios')
        .insert(payload);

      if(error) throw error;
      form.reset();
      setMsg(form, 'ok', 'Respuesta guardada correctamente.');
    }catch(error){
      console.error(error);
      setMsg(form, 'bad', 'No se pudo guardar. Revisá Supabase, la tabla y las políticas RLS.');
    }
  });
});
