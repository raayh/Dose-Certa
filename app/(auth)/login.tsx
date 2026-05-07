// ==========================================
// 1. IMPORTAÇÕES (React e Componentes Visuais)
// ==========================================
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ==========================================
// 2. IMPORTAÇÕES DO FIREBASE (Auth e Banco)
// ==========================================
import { auth, db } from "@/services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 // ==========================================
  // FUNÇÃO: LOGIN (Entrar em conta existente)
  // ==========================================
  const handleLogin = async () => {
    setLoading(true);
    try {
      const credenciais = await signInWithEmailAndPassword(auth, email, password);

      if (!credenciais.user.emailVerified) {
        await signOut(auth); // Chuta pra fora!
        Alert.alert("Acesso Negado", "Email não verificado");
        return;
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential'){
         Alert.alert(
          `O e-mail ${email} não foi encontrado.`,
          "Deseja criar uma conta com este e-mail e senha?",
          [ { text: "Não", style: "cancel" }, { text: "Sim, Criar!", onPress: () => handleSignUp() } ]
        );
      } else {
        Alert.alert("Erro", "E-mail ou senha inválidos");
      }
    } finally {
      setLoading(false);
    }
  };

 // ==========================================
  // FUNÇÃO: CADASTRO (Criar conta e persistir no Firestore)
  // ==========================================
  const handleSignUp = async () => {
    setLoading(true);
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = credentials.user;

      // =========================================
      // BANCO DE DADOS (Firestore)
      // 1. doc(): Localiza/Cria a "gaveta" 'users' usando a chave secreta 'user.uid'
      // 2. setDoc(): Guarda os dados lá dentro
      // =========================================
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        created_at: new Date()
      });

      // Verifica se o email existe
      await sendEmailVerification(user); 
      await signOut(auth);
      Alert.alert("Aguardando confirmação", "Enviamos um link de confirmação. Verifique sua caixa de entrada (ou Spam)!")
    } catch (error: any) {
      console.log("ERRO REAL DO FIREBASE:", error.code)
      Alert.alert("Erro no cadastro", "A senha deve ter pelo menos 6 caracteres.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* 1. Topo (Logo/Título) */}
      <View style={styles.header}>
        <View style={styles.header1}>
          <Image source={require("@/assets/images/logo.png")} />
          <Text style={styles.headerTitle}>Dose Certa</Text>
        </View>
        <View style={styles.header2}>
          <Text style={styles.headerSubtitle}>Bem vindo de volta</Text>
          <Text style={styles.headerText}>Não perca nenhum remédio hoje</Text>
        </View>
      </View>

      {/* 2. Meio (Formulários) */}
      <View style={styles.formContainer}>
        <View>
          <Text style={styles.textInput}>E-mail</Text>
          <TextInput
            value={email} // Exibe o que está na memória
            onChangeText={setEmail} // Atualiza a memória letra por letra
            style={styles.input}
            placeholder="email@exemplo.com"
            placeholderTextColor="#00000060"
          ></TextInput>
        </View>
        <View>
          <Text style={styles.textInput}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            placeholder="12345"
            placeholderTextColor="#00000060"
          ></TextInput>
        </View>
      </View>

      {/* 3. Rodapé (Botão) */}
      <TouchableOpacity
        style={styles.footer}
        onPress={handleLogin}
        disabled={loading} // Se estiver carregando, o clique não funciona!
      >
        {loading ? (
          <ActivityIndicator color="#fff" /> // A rodinha girando
        ) : (
          <Text style={styles.footerText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F5",
    gap: 55,
  },
  header: {
    justifyContent: "space-between",
    backgroundColor: "#65b874ff",
    alignItems: "center",
    width: "100%",
    height: "40%",
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
    paddingTop: 50,
    paddingBottom: 50,
  },
  header1: {
    flexDirection: "row",
    gap: 8,
    textAlign: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_500Medium", // Após instalar e carregar
    fontSize: 34,
    fontWeight: "500", // No React Native, usamos strings como '500' para Medium
    color: "#fff",
  },
  header2: {
    alignItems: "center",
  },
  headerSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 24,
    color: "#fff",
  },
  headerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  formContainer: {
    alignSelf: "center",
    gap: 40,
    justifyContent: "center",
  },
  textInput: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  input: {
    borderRadius: 24,
    width: 320,
    height: 50,
    backgroundColor: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    paddingLeft: 20,
    alignItems: "center",
  },
  footer: {
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#65b874ff",
    width: 298,
    height: 64,
    alignSelf: "center",
  },
  footerText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 24,
    textAlign: "center",
  },
});
