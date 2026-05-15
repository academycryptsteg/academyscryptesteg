const cfg = window.CRYPTSTEG_CONFIG || {};
const registroEstado = document.getElementById('registroEstado');
const participanteForm = document.getElementById('participanteForm');
const participanteNombre = document.getElementById('participanteNombre');
const participanteMsg = document.getElementById('participanteMsg');
const FECHA_EVENTO = new Date().toISOString().slice(0, 10);

function hasSupabaseConfig(){
  return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
}

let supabaseClient = null;
if(hasSupabaseConfig()){
  supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

function normalizeText(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ ]/g, '')
    .replace(/\s+/g, ' ');
}

function getParticipante(){
  try{
    const data = JSON.parse(localStorage.getItem('cryptsteg_participante') || 'null');
    if(data && data.fecha_evento === FECHA_EVENTO) return data;
  }catch(e){
    return null;
  }
  return null;
}

function setParticipante(data){
  localStorage.setItem('cryptsteg_participante', JSON.stringify(data));
}

function renderRegistroEstado(){
  const participante = getParticipante();
  if(participante && participante.id){
    registroEstado.className = 'notice ok';
    registroEstado.innerHTML = `<strong>Participante activo:</strong> ${participante.nombre}`;
    participanteNombre.value = participante.nombre || '';
  }else{
    registroEstado.className = 'notice warn';
    registroEstado.innerHTML = '<strong>Para guardar respuestas:</strong> escribí tu nombre una sola vez. No necesitás registro completo.';
  }
}

function setFormMsg(element, type, text){
  element.className = `form-msg ${type || ''}`;
  element.textContent = text;
}

async function crearParticipante(nombre){
  const payload = {
    nombre,
    fecha_evento: FECHA_EVENTO,
    user_agent: navigator.userAgent,
    page_url: window.location.href
  };

  if(!supabaseClient){
    const fake = { id: crypto.randomUUID(), ...payload };
    setParticipante(fake);
    return fake;
  }

  const { data, error } = await supabaseClient
    .from(cfg.PARTICIPANTES_TABLE || 'expo_participantes_desafio')
    .insert(payload)
    .select('id,nombre,fecha_evento')
    .single();

  if(error) throw error;
  setParticipante(data);
  return data;
}

participanteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = participanteNombre.value.trim();
  if(!nombre){
    setFormMsg(participanteMsg, 'bad', 'Escribí tu nombre para participar.');
    return;
  }

  setFormMsg(participanteMsg, '', 'Guardando nombre...');
  try{
    const participante = await crearParticipante(nombre);
    setFormMsg(participanteMsg, 'ok', `Listo, ${participante.nombre}. Ya podés resolver los desafíos.`);
    renderRegistroEstado();
  }catch(error){
    console.error(error);
    setFormMsg(participanteMsg, 'bad', 'No se pudo guardar el nombre. Revisá Supabase.');
  }
});

renderRegistroEstado();

function setMsg(form, type, text){
  const msg = form.querySelector('.form-msg');
  msg.className = `form-msg ${type || ''}`;
  msg.textContent = text;
}

function evaluarRespuesta(desafio, respuesta){
  const correctas = (cfg.RESPUESTAS_CORRECTAS && cfg.RESPUESTAS_CORRECTAS[desafio]) || [];
  if(!Array.isArray(correctas) || correctas.length === 0){
    return { es_correcta: null, puntaje: 0, evaluacion: 'pendiente' };
  }
  const normalizada = normalizeText(respuesta);
  const ok = correctas.some(item => normalizeText(item) === normalizada);
  return { es_correcta: ok, puntaje: ok ? 1 : 0, evaluacion: 'automatica' };
}

async function ensureParticipante(){
  let participante = getParticipante();
  if(participante && participante.id) return participante;
  const nombre = participanteNombre.value.trim();
  if(!nombre) return null;
  participante = await crearParticipante(nombre);
  renderRegistroEstado();
  return participante;
}

async function buildPayload(form){
  const participante = await ensureParticipante();
  if(!participante || !participante.id) return null;
  const fd = new FormData(form);
  const respuesta = String(fd.get('respuesta') || '').trim();
  const evaluacion = evaluarRespuesta(form.dataset.desafio, respuesta);

  return {
    participante_id: participante.id,
    participante_nombre: participante.nombre,
    fecha_evento: FECHA_EVENTO,
    desafio: form.dataset.desafio,
    respuesta,
    clave: String(fd.get('clave') || '').trim(),
    observaciones: String(fd.get('observaciones') || '').trim(),
    es_correcta: evaluacion.es_correcta,
    puntaje: evaluacion.puntaje,
    evaluacion: evaluacion.evaluacion,
    user_agent: navigator.userAgent,
    page_url: window.location.href
  };
}

document.querySelectorAll('.challenge-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let payload = null;

    try{
      payload = await buildPayload(form);
    }catch(error){
      console.error(error);
      setMsg(form, 'bad', 'No se pudo preparar el participante. Revisá Supabase.');
      return;
    }

    if(!payload){
      setMsg(form, 'bad', 'Escribí tu nombre arriba para guardar la respuesta.');
      participanteNombre.focus();
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
      const extra = payload.evaluacion === 'pendiente' ? ' Quedó pendiente de corrección.' : '';
      setMsg(form, 'ok', `Respuesta guardada correctamente.${extra}`);
    }catch(error){
      console.error(error);
      setMsg(form, 'bad', 'No se pudo guardar. Revisá Supabase, la tabla y las políticas RLS.');
    }
  });
});
