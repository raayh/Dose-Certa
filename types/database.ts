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
  amountPerTime: number; // Dose por vez.
  times: string[]; // Lista de horários ["08:00", "16:00"].
  startDate: string; // Data de início (ISO string).
  repeatType: string; // Ex: "Todos os dias", "Seg, Qua".
  endDate: string | null; // Data final do tratamento ou null.
  created_at: string; // Timestamp da criação.
}
