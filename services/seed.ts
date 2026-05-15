import { auth, db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

/**
 * 🌱 MOTOR DE SEMEADURA (SEED) - Dose Certa
 * Este script injeta dados de teste diretamente no Firestore.
 * ⚠️ LEMBRETE: Chame esta função apenas uma vez para não duplicar dados!
 */
export async function seedMedications() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error("❌ Erro: Nenhum usuário logado. Faça login primeiro!");
    return;
  }

  const medications = [
    {
      name: "Amoxicilina",
      type: "Comprimido",
      timesPerDay: 3,
      dosage: "500 mg",
      times: ["08:00", "16:00", "00:00"],
      startDate: new Date().toISOString().split('T')[0],
      repeatType: "Todos os dias",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      user_id: user.uid,
      created_at: new Date().toISOString()
    },
    {
      name: "Rivotril",
      type: "Gotas",
      timesPerDay: 1,
      dosage: "5 gotas",
      times: ["22:00"],
      startDate: new Date().toISOString().split('T')[0],
      repeatType: "Todos os dias",
      endDate: null,
      user_id: user.uid,
      created_at: new Date().toISOString()
    },
    {
      name: "Insulina",
      type: "Injeção",
      timesPerDay: 2,
      dosage: "10 ml",
      times: ["07:00", "19:00"],
      startDate: new Date().toISOString().split('T')[0],
      repeatType: "Todos os dias",
      endDate: null,
      user_id: user.uid,
      created_at: new Date().toISOString()
    },
    {
      name: "Vitamina D",
      type: "Cápsula",
      timesPerDay: 1,
      dosage: "1 cápsula",
      times: ["10:00"],
      startDate: new Date().toISOString().split('T')[0],
      repeatType: "Semanalmente",
      endDate: null,
      user_id: user.uid,
      created_at: new Date().toISOString()
    }
  ];

  try {
    console.log("🌱 Semeando remédios de teste para o usuário:", user.email);
    
    // Usamos um loop simples para garantir que todos sejam enviados
    for (const med of medications) {
      await addDoc(collection(db, "medications"), med);
    }

    console.log("✅ Semeadura concluída!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao semear banco de dados:", error);
    throw error;
  }
}

/**
 * 🧹 MOTOR DE LIMPEZA
 * Deleta todos os remédios vinculados ao usuário logado.
 */
export async function clearMedications() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const { getDocs, deleteDoc, doc } = await import("firebase/firestore");
    const q = query(collection(db, "medications"), where("user_id", "==", user.uid));
    const snapshot = await getDocs(q);

    console.log(`🧹 Deletando ${snapshot.size} remédios...`);
    
    const deletePromises = snapshot.docs.map((document) => 
      deleteDoc(doc(db, "medications", document.id))
    );
    
    await Promise.all(deletePromises);
    console.log("✅ Banco limpo!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao limpar banco:", error);
    throw error;
  }
}

// Nota: Precisamos importar query e where para a limpeza
import { query, where } from "firebase/firestore";
