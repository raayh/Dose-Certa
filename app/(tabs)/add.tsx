import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { auth, db } from '@/services/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { seedMedications, clearMedications } from '@/services/seed';

function Counter({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        borderColor: "#65b874ff",
        borderWidth: 0.5,
        borderRadius: 26,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <TouchableOpacity
        onPress={onDecrement}
        disabled={value === 1}
        style={{
          opacity: value === 1 ? 0.3 : 1,
          justifyContent: "center",
          alignItems: "center",
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#a3dcadff",
        }}
      >
        <Text style={{ fontSize: 13 }}>-</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 15 }}>{value}</Text>

      <TouchableOpacity
        onPress={onIncrement}
        style={{
          justifyContent: "center",
          alignItems: "center",
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#a3dcadff",
        }}
      >
        <Text style={{ fontSize: 14 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AddScreen() {
  const [name, setName] = useState("");
  const [type, setType] = useState("Comprimido");
  const [timesPerDay, seTtimesPerDay] = useState(1);
  const [dosageAmount, setDosageAmount] = useState("");
  const [startTime, setStartTime] = useState(new Date(2000, 0, 1, 8, 0));
  const [showPicker, setShowPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [repeatType, setRepeatType] = useState("Todos os dias");
  const [repeatMode, setRepeatMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(15);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const medicationTypes = [
    { name: "Comprimido" },
    { name: "Cápsula" },
    { name: "Gotas" },
    { name: "Xarope" },
    { name: "Injeção" },
    { name: "Outros" },
  ];

  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];
  const unitMap: Record<string, string> = {
    Comprimido: "mg",
    Cápsula: "mg",
    Gotas: "gotas",
    Xarope: "ml",
    Injeção: "ml",
    Outros: "", // outros não tem essa opção
  };

  // Intervalo em minutos (24 horas * 60 minutos / quantidade de vezes)
  const intervalMinutes = Math.floor((24 * 60) / timesPerDay);

  const times = Array.from({ length: timesPerDay }, (_, i) => {
    // Cria uma cópia do horário de início
    const doseTime = new Date(startTime);
    // Adiciona o intervalo em minutos
    doseTime.setMinutes(doseTime.getMinutes() + i * intervalMinutes);

    // Formata para string no formato "HH:mm" (ex: "08:30")
    const hours = doseTime.getHours().toString().padStart(2, "0");
    const minutes = doseTime.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  const getStartDateLabel = () => {
    const day = startDate.getDate().toString().padStart(2, "0");
    const month = (startDate.getMonth() + 1).toString().padStart(2, "0");
    return `Inicia dia ${day}/${month}`;
  };

  const getDurationLabel = () => {
    if (!endDate) return "Uso contínuo";
    const day = endDate.getDate().toString().padStart(2, "0");
    const month = (endDate.getMonth() + 1).toString().padStart(2, "0");
    return `Até ${day}/${month}`;
  };

  const toggleDay = (index: number) => {
    setRepeatMode("weekly"); // Muda automaticamente para semanal ao clicar em um dia
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter((day) => day !== index));
    } else {
      setSelectedDays([...selectedDays, index]);
    }
  };

  const handleSaveRepeat = () => {
    if (repeatMode === "daily") {
      setRepeatType("Todos os dias");
    } else if (repeatMode === "weekly") {
      if (selectedDays.length === 0) {
        setRepeatType("Nenhum dia");
      } else if (selectedDays.length === 7) {
        setRepeatType("Todos os dias");
      } else {
        const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const label = selectedDays.map((d) => weekDaysShort[d]).join(", ");
        setRepeatType(label);
      }
    } else if (repeatMode === "monthly") {
      setRepeatType(`Todo dia ${selectedDayOfMonth}`);
    }
    setShowRepeatModal(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Atenção", "Por favor, digite o nome do medicamento.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado. Verifique sua conexão e tente novamente.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "medications"), {
        user_id: user.uid,
        name: name,
        type: type,
        timesPerDay: timesPerDay,
        dosage: dosageAmount ? `${dosageAmount} ${unitMap[type]}`.trim() : "",
        times: times,
        startDate: startDate.toISOString(),
        repeatType: repeatType,
        endDate: endDate ? endDate.toISOString() : null,
        created_at: new Date().toISOString(),
      });

      setLoading(false);
      Alert.alert("Sucesso 🎉", `O medicamento "${name}" foi cadastrado com sucesso!`, [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error) {
      console.log("Erro ao salvar:", error);
      setLoading(false);
      Alert.alert("Erro", "Não foi possível salvar o medicamento no banco de dados.");
    }
  };

  const resetForm = () => {
    setName("");
    setType("Comprimido");
    seTtimesPerDay(1);
    setDosageAmount("");
    setStartTime(new Date(2000, 0, 1, 8, 0));
    setStartDate(new Date());
    setEndDate(null);
    setRepeatType("Todos os dias");
    setRepeatMode("daily");
    setSelectedDayOfMonth(15);
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedMedications();
      Alert.alert("🌱 Sucesso", "Banco semeado com 4 remédios de teste!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível semear os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    Alert.alert("Limpar Banco", "Tem certeza que deseja apagar TODOS os seus remédios?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim, Limpar",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await clearMedications();
            Alert.alert("🧹 Sucesso", "Todos os seus remédios foram apagados.");
          } catch (error) {
            Alert.alert("Erro", "Não foi possível limpar o banco.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={30} style={styles.backButton} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={name}
            style={styles.headerName}
            onChangeText={(text) => setName(text)}
            placeholder="Nome do Remedio"
            placeholderTextColor="#00000060"
          ></TextInput>
          <Ionicons name="pencil" size={20} color="#a3dcadff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.form}
        contentContainerStyle={{
          gap: 10,
          flexDirection: "column",
          paddingBottom: 40,
        }}
      >
        <View style={styles.typeSelector}>
          <ScrollView horizontal showsVerticalScrollIndicator={false} style={styles.typeList}>
            {medicationTypes.map((item) => (
              <TouchableOpacity
                key={item.name}
                onPress={() => setType(item.name)}
                style={[styles.typeButton, type === item.name && styles.typeButtonSelected]}
              >
                <Text style={type === item.name ? styles.typeTextSelected : styles.typeText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.settingRow}>
            <Text style={styles.settingRowText}>Quantas vezes por dia?</Text>
            <Counter
              value={timesPerDay}
              onIncrement={() => seTtimesPerDay(timesPerDay + 1)}
              onDecrement={() => seTtimesPerDay(timesPerDay - 1)}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingRowText}>Dosagem</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#65b874ff",
                borderWidth: 0.5,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: "#FFFFFF",
              }}
            >
              <TextInput
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 13,
                  color: "#333",
                  textAlign: "center",
                  minWidth: type === "Outros" ? 100 : 35,
                  padding: 0,
                }}
                keyboardType={type === "Outros" ? "default" : "numeric"}
                autoCapitalize="none"
                value={dosageAmount}
                onChangeText={setDosageAmount}
                placeholder={type === "Outros" ? "Ex: 1 colher" : "Ex: 20"}
              />
              {type !== "Outros" && <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: "#333", marginLeft: 4 }}>{unitMap[type]}</Text>}
            </View>
          </View>
          <View style={styles.setHours}>
            {times.map((hour, index) => (
              <TouchableOpacity
                key={index}
                onPress={index === 0 ? () => setShowPicker(true) : undefined}
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                  width: "50%",
                  paddingVertical: 8,
                  paddingLeft: index === 0 ? 15 : 0,
                  borderColor: index === 0 ? "#65b874ff" : "transparent",
                  borderWidth: index === 0 ? 0.5 : 0,
                  borderRadius: 18,
                  backgroundColor: index === 0 ? "#65b87415" : "transparent",
                }}
              >
                <Ionicons name="time-outline" size={20} />
                <Text style={{ width: 50 }}>{hour}</Text>
                {index === 0 && <Ionicons name="pencil" size={12} color="#65b874ff" />}
              </TouchableOpacity>
            ))}
          </View>
          {showPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) {
                  setStartTime(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.frequencySelector}>
          <View style={styles.settingRow}>
            <Text style={styles.settingRowText}>Início</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.settingRowText}> {getStartDateLabel()} </Text>
              <Ionicons name="chevron-down" size={20} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}

          <View style={styles.settingRow}>
            <Text style={styles.settingRowText}>Repetir</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowRepeatModal(true)}>
              <Text style={styles.settingRowText}> {repeatType} </Text>
              <Ionicons name="chevron-down" size={20} />
            </TouchableOpacity>
          </View>

          {showRepeatModal && (
            <Modal visible={showRepeatModal} transparent={true} animationType="slide" onRequestClose={() => setShowRepeatModal(false)}>
              <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setShowRepeatModal(false)}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                  <Text style={styles.modalTitle}> Selecione os dias que deseja tomar o remédio</Text>
                  <TouchableOpacity
                    style={[styles.modalOptionRow, repeatMode === "daily" && styles.modalOptionActive]}
                    onPress={() => setRepeatMode("daily")}
                  >
                    <Ionicons name={repeatMode === "daily" ? "radio-button-on" : "radio-button-off"} size={20} color="#65b874ff" />
                    <Text style={styles.modalOptionText}>Todos os dias</Text>
                  </TouchableOpacity>
                  <View style={[styles.modalOptionColumn, repeatMode === "weekly" && styles.modalOptionActive]}>
                    <TouchableOpacity style={styles.modalOptionHeader} onPress={() => setRepeatMode("weekly")}>
                      <Ionicons name={repeatMode === "weekly" ? "radio-button-on" : "radio-button-off"} size={20} color="#65b874ff" />
                      <Text style={styles.modalOptionText}> Semanal </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", gap: 6, paddingLeft: 28, marginTop: 5 }}>
                      {daysOfWeek.map((day, index) => {
                        const isSelected = selectedDays.includes(index);
                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => toggleDay(index)}
                            style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                          >
                            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={[styles.modalOptionColumn, repeatMode === "monthly" && styles.modalOptionActive]}>
                    <TouchableOpacity style={styles.modalOptionHeader} onPress={() => setRepeatMode("monthly")}>
                      <Ionicons name={repeatMode === "monthly" ? "radio-button-on" : "radio-button-off"} size={20} color="#65b874ff" />
                      <Text style={styles.modalOptionText}> Mensal </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 15, paddingLeft: 28, marginTop: 5 }}>
                      <Text style={styles.modalSubText}>Escolha o dia:</Text>
                      <TextInput
                        style={styles.dayInput}
                        value={selectedDayOfMonth === 0 ? "" : selectedDayOfMonth.toString()}
                        keyboardType="numeric"
                        maxLength={2}
                        onChangeText={(text) => {
                          setRepeatMode("monthly");
                          const cleanText = text.replace(/[^0-9]/g, "");
                          const num = parseInt(cleanText) || 0;
                          if (num <= 31) setSelectedDayOfMonth(num);
                        }}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
                    <TouchableOpacity style={[styles.modalActionButton, { backgroundColor: "#F5F5F5" }]} onPress={() => setShowRepeatModal(false)}>
                      <Text style={[styles.modalActionButtonText, { color: "#7F7F7F" }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalActionButton, { backgroundColor: "#65b874ff" }]} onPress={handleSaveRepeat}>
                      <Text style={[styles.modalActionButtonText, { color: "#FFFFFF" }]}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          <View style={styles.settingRow}>
            <Text style={styles.settingRowText}>Duração</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                Alert.alert("Duração do Tratamento", "Escolha como o remédio será tomado:", [
                  { text: "Uso contínuo", onPress: () => setEndDate(null) },
                  { text: "Escolher data final", onPress: () => setShowEndDatePicker(true) },
                  { text: "Cancelar", style: "cancel" },
                ]);
              }}
            >
              <Text style={styles.settingRowText}> {getDurationLabel()} </Text>
              <Ionicons name="chevron-down" size={20} />
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* 🛠️ SEÇÃO ADMIN (SEED E CLEAR) */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.saveButton, { flex: 1, backgroundColor: "#EBF7EE", borderWidth: 1, borderColor: "#65b874ff" }]}
            onPress={handleSeed}
          >
            <Text style={[styles.saveButtonText, { color: "#65b874ff" }]}>🌱 Semear Teste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { flex: 1, backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FF5252" }]}
            onPress={handleClear}
          >
            <Text style={[styles.saveButtonText, { color: "#FF5252" }]}>🧹 Limpar Banco</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar medicamento</Text>}
      </TouchableOpacity>

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color="#65b874ff" />
          <Text style={{ marginTop: 10, color: "#65b874ff", fontWeight: "600" }}>Aguarde...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F4F6F5",
    flex: 1,
    paddingVertical: 40,
    paddingHorizontal: 25,
  },
  header: {
    justifyContent: "flex-start",
    flexDirection: "column",
    gap: 18,
  },
  backButton: {},
  headerName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 24,
  },
  form: {
    flex: 1,
  },
  typeSelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 25,
  },
  typeList: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  typeButton: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginRight: 10,
    gap: 5,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  typeButtonSelected: {
    backgroundColor: "#65b874ff",
  },
  typeTextSelected: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    fontWeight: "500",
    color: "#fff",
  },
  typeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    fontWeight: "500",
  },
  settingRow: {
    justifyContent: "space-between",
    flexDirection: "row",
  },
  settingRowText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    fontWeight: "500",
  },
  setHours: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  frequencySelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 25,
  },
  selectButton: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    borderColor: "#65b874ff",
    borderWidth: 0.5,
    borderRadius: 26,
    paddingHorizontal: 5,
    paddingTop: 2,
  },
  saveButton: {
    backgroundColor: "#65b874ff",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  saveButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 15,
  },
  modalTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalOptionColumn: {
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 5,
  },
  modalOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalOptionActive: {
    backgroundColor: "#65b87415",
  },
  modalOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#333",
  },
  modalSubText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#7F7F7F",
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalActionButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    fontWeight: "bold",
  },
  dayButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  dayButtonSelected: {
    backgroundColor: "#65b874ff",
  },
  dayText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#7F7F7F",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  dayInput: {
    borderColor: "#65b874ff",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 45,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#333",
    backgroundColor: "#FFFFFF",
  },
});
