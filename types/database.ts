// ==========================================
// 📊 MODELAGEM DE DADOS DO FIREBASE (NOSQL)
// ==========================================
// Mente de Arquiteta: Como o NoSQL (Firestore) não exige tabelas fixas,
// o TypeScript (estas interfaces) é a nossa única "barreira de segurança"
// para garantir que ninguém salve campos errados no banco!

// ---------------------------------------------------------
// 1. USUÁRIOS (Coleção "users")
// Só precisamos salvar informações extras aqui. Senhas NUNCA vêm para cá.
// ---------------------------------------------------------
export interface User {
  id: string; // Chave primária gerada pelo auth
  email: string;
  created_at: Date;
}

// ---------------------------------------------------------
// 2. MEDICAMENTOS (Coleção "medications")
// A mágica da desnormalização: juntamos horários e sintomas dentro
// do próprio documento para o app não precisar cruzar dados (JOINs).
// ---------------------------------------------------------
export interface Medication {
  id?: string; // Opcional: o Firebase gera o ID automaticamente.
  user_id: string; // Chave Estrangeira do Usuário logado.
  name: string; // Nome do remédio.
  type: string; // Ex: "Comprimido", "Gotas".
  timesPerDay: number; // Quantidade de vezes por dia.
  dosage: string; // Ex: "20 mg","5 ml"
  times: string[]; // Lista de horários ["08:00", "16:00"].
  startDate: string; // Data de início (ISO string).
  repeatType: string; // Ex: "Todos os dias", "Seg, Qua".
  endDate: string | null; // Data final do tratamento ou null.
  created_at: string; // Timestamp da criação.
}

// ---------------------------------------------------------
// 3. HISTÓRICO DE DOSES (Coleção "history")
// Armazena os registros de check-in para que a Home filtre o que
// ainda está pendente hoje.
// ---------------------------------------------------------
export interface MedicationHistory {
  id?: string;
  medication_id: string; // Chave Estrangeira do medicamento
  user_id: string; // Chave Estrangeira do usuário
  date: string; // Data da ação (Ex: "2026-05-13")
  time: string; // Horário da dose teórica (Ex: "08:00")
  status: 'taken' | 'skipped'; // Se o usuário tomou ou pulou
  taken_at: string; // Timestamp exato de quando o botão foi apertado
}
