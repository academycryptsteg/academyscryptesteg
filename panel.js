const cfg = window.CRYPTSTEG_CONFIG || {};
const fechaEvento = document.getElementById('fechaEvento');
const btnCargar = document.getElementById('btnCargar');
const btnGanadorMerito = document.getElementById('btnGanadorMerito');
const btnSorteo = document.getElementById('btnSorteo');
const panelMsg = document.getElementById('panelMsg');
const rankingBody = document.getElementById('rankingBody');
const respuestasLista = document.getElementById('respuestasLista');
const ganadorMerito = document.getElementById('ganadorMerito');
const ganadorSorteo = document.getElementById('ganadorSorteo');

let supabaseClient = null;
let participantes = [];
let respuestas = [];
let ganadoresHistoricos = [];
let ranking = [];
let ganadorMeritoActual = null;

fechaEvento.value = new Date().toISOString().slice(0, 10);

function hasSupabaseConfig(){
  return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
}

function setPanelMsg(type, text){
  panelMsg.className = `notice ${type || ''}`;
  panelMsg.textContent = text;
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function shuffle(array){
  const copy = [...array];
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

if(hasSupabaseConfig()){
  supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
} else {
  setPanelMsg('bad', 'Falta configurar Supabase en config.js.');
}

async function cargarDatos(){
  if(!supabaseClient){
    setPanelMsg('bad', 'Falta configurar Supabase en config.js.');
    return;
  }

  const fecha = fechaEvento.value;
  setPanelMsg('', 'Cargando datos...');
  ganadorMerito.innerHTML = '';
  ganadorSorteo.innerHTML = '';
  ganadorMeritoActual = null;

  const [{ data: pData, error: pError }, { data: rData, error: rError }, { data: gData, error: gError }] = await Promise.all([
    supabaseClient.from(cfg.PARTICIPANTES_TABLE || 'expo_participantes_desafio').select('*').eq('fecha_evento', fecha),
    supabaseClient.from(cfg.RESPUESTAS_TABLE || 'expo_respuestas_desafios').select('*').eq('fecha_evento', fecha),
    supabaseClient.from(cfg.GANADORES_TABLE || 'expo_ganadores_diarios').select('*')
  ]);

  if(pError || rError || gError){
    console.error(pError || rError || gError);
    setPanelMsg('bad', 'No se pudieron cargar los datos. Revisá tablas y políticas RLS.');
    return;
  }

  participantes = pData || [];
  respuestas = rData || [];
  ganadoresHistoricos = gData || [];
  construirRanking();
  renderRanking();
  renderRespuestas();
  setPanelMsg('ok', `Datos cargados: ${participantes.length} participantes y ${respuestas.length} respuestas.`);
}

function normalizarNombre(value){
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function ganadoresPrevios(){
  const fecha = fechaEvento.value;
  const previos = ganadoresHistoricos.filter(g => g.fecha_evento < fecha);
  return {
    ids: new Set(previos.map(g => g.participante_id).filter(Boolean)),
    nombres: new Set(previos.map(g => normalizarNombre(g.participante_nombre)).filter(Boolean))
  };
}

function estaExcluidoPorGanadorPrevio(participante){
  const previos = ganadoresPrevios();
  return previos.ids.has(participante.id) || previos.nombres.has(normalizarNombre(participante.nombre));
}

function construirRanking(){
  const mapa = new Map();
  const previos = ganadoresPrevios();

  participantes.forEach(p => {
    mapa.set(p.id, {
      id: p.id,
      nombre: p.nombre,
      correctas: 0,
      respuestas: 0,
      excluido: previos.ids.has(p.id) || previos.nombres.has(normalizarNombre(p.nombre))
    });
  });

  const mejoresPorDesafio = new Map();
  respuestas.forEach(r => {
    if(!mapa.has(r.participante_id)){
      mapa.set(r.participante_id, {
        id: r.participante_id,
        nombre: r.participante_nombre || 'Sin nombre',
        correctas: 0,
        respuestas: 0,
        excluido: previos.ids.has(r.participante_id) || previos.nombres.has(normalizarNombre(r.participante_nombre))
      });
    }
    const item = mapa.get(r.participante_id);
    item.respuestas += 1;
    const key = `${r.participante_id}::${r.desafio}`;
    const puntaje = Number(r.puntaje || 0);
    mejoresPorDesafio.set(key, Math.max(mejoresPorDesafio.get(key) || 0, puntaje));
  });

  mejoresPorDesafio.forEach((puntos, key) => {
    const participanteId = key.split('::')[0];
    if(mapa.has(participanteId)) mapa.get(participanteId).correctas += puntos;
  });

  ranking = [...mapa.values()].sort((a, b) => b.correctas - a.correctas || b.respuestas - a.respuestas || a.nombre.localeCompare(b.nombre));
}

function renderRanking(){
  if(!ranking.length){
    rankingBody.innerHTML = '<tr><td colspan="4">Todavía no hay participantes para esta fecha.</td></tr>';
    return;
  }
  rankingBody.innerHTML = ranking.map(item => `
    <tr>
      <td>${escapeHtml(item.nombre)}</td>
      <td><strong>${item.correctas}</strong></td>
      <td>${item.respuestas}</td>
      <td>${item.excluido ? 'Ya ganó antes' : 'Participa'}</td>
    </tr>
  `).join('');
}

function renderRespuestas(){
  if(!respuestas.length){
    respuestasLista.innerHTML = '<p class="notice warn">Todavía no hay respuestas para esta fecha.</p>';
    return;
  }

  respuestasLista.innerHTML = respuestas.map(r => {
    const estado = r.es_correcta === true ? 'Correcta' : r.es_correcta === false ? 'Incorrecta' : 'Pendiente';
    return `
      <article class="answer-card" data-id="${r.id}">
        <div>
          <strong>${escapeHtml(r.participante_nombre || 'Sin nombre')}</strong>
          <span>${escapeHtml(r.desafio)} · ${estado} · ${Number(r.puntaje || 0)} punto</span>
        </div>
        <p><b>Respuesta:</b> ${escapeHtml(r.respuesta)}</p>
        ${r.clave ? `<p><b>Clave:</b> ${escapeHtml(r.clave)}</p>` : ''}
        ${r.observaciones ? `<p><b>Observaciones:</b> ${escapeHtml(r.observaciones)}</p>` : ''}
        <div class="answer-actions">
          <button class="btn ghost small" type="button" data-action="correcta" data-id="${r.id}">Correcta +1</button>
          <button class="btn ghost small" type="button" data-action="incorrecta" data-id="${r.id}">Incorrecta 0</button>
        </div>
      </article>
    `;
  }).join('');
}

async function marcarRespuesta(id, correcta){
  const { error } = await supabaseClient
    .from(cfg.RESPUESTAS_TABLE || 'expo_respuestas_desafios')
    .update({
      es_correcta: correcta,
      puntaje: correcta ? 1 : 0,
      evaluacion: 'manual'
    })
    .eq('id', id);

  if(error){
    console.error(error);
    setPanelMsg('bad', 'No se pudo actualizar la respuesta. Revisá la política UPDATE en Supabase.');
    return;
  }
  await cargarDatos();
}

respuestasLista.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  marcarRespuesta(btn.dataset.id, btn.dataset.action === 'correcta');
});

async function guardarGanador(tipo, participante){
  const payload = {
    fecha_evento: fechaEvento.value,
    participante_id: participante.id,
    participante_nombre: participante.nombre,
    tipo,
    total_correctas: participante.correctas || 0
  };
  const { error } = await supabaseClient
    .from(cfg.GANADORES_TABLE || 'expo_ganadores_diarios')
    .upsert(payload, { onConflict: 'fecha_evento,tipo' });

  if(error){
    console.error(error);
    setPanelMsg('bad', 'Se mostró el ganador, pero no se pudo guardarlo en la tabla de ganadores.');
  }else{
    ganadoresHistoricos.push(payload);
  }
}

btnGanadorMerito.addEventListener('click', async () => {
  if(!ranking.length) await cargarDatos();
  const candidatos = ranking.filter(p => !p.excluido && p.correctas > 0);
  if(!candidatos.length){
    ganadorMerito.innerHTML = '<p>No hay candidatos con respuestas correctas para esta fecha.</p>';
    return;
  }
  ganadorMeritoActual = candidatos[0];
  ganadorMerito.innerHTML = `<h3>🏆 Ganador: ${escapeHtml(ganadorMeritoActual.nombre)}</h3><p>${ganadorMeritoActual.correctas} desafío/s correcto/s.</p>`;
  await guardarGanador('merito', ganadorMeritoActual);
});

btnSorteo.addEventListener('click', async () => {
  if(!ranking.length) await cargarDatos();
  const previos = ganadoresPrevios();
  const yaGanaronHoy = new Set(
    ganadoresHistoricos
      .filter(g => g.fecha_evento === fechaEvento.value)
      .map(g => g.participante_id)
  );
  if(ganadorMeritoActual) yaGanaronHoy.add(ganadorMeritoActual.id);

  const candidatos = ranking.filter(p => !previos.ids.has(p.id) && !previos.nombres.has(normalizarNombre(p.nombre)) && !yaGanaronHoy.has(p.id));
  if(!candidatos.length){
    ganadorSorteo.innerHTML = '<p>No hay candidatos disponibles para sorteo.</p>';
    return;
  }
  const ganador = shuffle(candidatos)[0];
  ganadorSorteo.innerHTML = `<h3>🎲 Sorteo: ${escapeHtml(ganador.nombre)}</h3><p>Seleccionado aleatoriamente entre ${candidatos.length} participante/s.</p>`;
  await guardarGanador('sorteo', ganador);
});

btnCargar.addEventListener('click', cargarDatos);
cargarDatos();
