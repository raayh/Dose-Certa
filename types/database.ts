// ==========================================
// 📊 MODELAGEM DE DADOS DO FIREBASE (NOSQL)
// ==========================================

// ---------------------------------------------------------
// 1. USUÁRIOS (Coleção "users")
// Só precisamos salvar informações extras aqui. Senhas NUNCA vêm para cá.
// ---------------------------------------------------------
export interface User {
  id: string; // Chave primária gerada pelo auth
  email: string;
  created_at: Date;
}