// CONFIGURACIÓN DE SUPABASE
// Pegar aquí la Project URL y la anon public key del proyecto.
// No pegar service_role ni claves secretas.

window.CRYPTSTEG_CONFIG = {
  SUPABASE_URL: "https://qhybeaqnowwvbgsobtos.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeWJlYXFub3d3dmJnc29idG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTY3OTAsImV4cCI6MjA5NDQzMjc5MH0.nlBmKu2IMn8ubv-Z3r_8Fa6hPcHPIgJam3y-CLhPCDI",
  TABLE_NAME: "expo_registros",
  PARTICIPANTES_TABLE: "expo_participantes_desafio",
  RESPUESTAS_TABLE: "expo_respuestas_desafios",
  GANADORES_TABLE: "expo_ganadores_diarios",

  // Opcional: si querés corrección automática, cargá acá las respuestas correctas.
  // Si queda vacío, las respuestas se guardan como pendientes y se corrigen desde panel.html.
  RESPUESTAS_CORRECTAS: {
    barbie: [],
    pigpen: [],
    polybius: [],
    vigenere_1: [],
    vigenere_2: []
  }
};
