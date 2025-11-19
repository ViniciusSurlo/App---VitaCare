// src/screens/MedicamentosScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../services/supabaseClient";
import { useTheme } from "../utils/ThemeContext";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { cancelMedicationNotifications } from "../services/notificationService";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 15;

export default function MedicamentosScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [medicamentos, setMedicamentos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchMedicamentos(true);
    }
  }, [isFocused]);

  // Usar useMemo para evitar re-renders desnecessários
  const filteredMedicamentos = useMemo(() => {
    let filtered = [...medicamentos];

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.nome.toLowerCase().includes(query) ||
          (med.dosagem && med.dosagem.toLowerCase().includes(query))
      );
    }

    // Filtro por tipo
    if (filterType === "Ativos") {
      filtered = filtered.filter((med) => !med.finalizado);
    } else if (filterType === "Finalizados") {
      filtered = filtered.filter((med) => med.finalizado);
    }

    return filtered;
  }, [medicamentos, searchQuery, filterType]);

  const fetchMedicamentos = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const currentPage = reset ? 1 : page;
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: meds, error } = await supabase
      .from("medicamentos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      if (reset) {
        setMedicamentos(meds || []);
      } else {
        setMedicamentos((prev) => [...prev, ...(meds || [])]);
      }

      if (!meds || meds.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      if (!reset) {
        setPage((prev) => prev + 1);
      }
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const handleTakeMedicine = async (medicamento) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("uso_medicamento").insert({
      medicamento_id: medicamento.id,
      user_id: user.id,
      quantidade_usada: 1,
    });

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert(
        "✅ Registrado",
        `${medicamento.nome} foi marcado como tomado.`
      );
    }
  };

  const handleDelete = async (medicamento) => {
    Alert.alert(
      "Excluir medicamento",
      `Deseja realmente excluir "${medicamento.nome}"? Todas as notificações agendadas serão canceladas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("medicamentos")
              .delete()
              .eq("id", medicamento.id);
            if (!error) {
              await cancelMedicationNotifications(medicamento.id);
              fetchMedicamentos(true);
            }
          },
        },
      ]
    );
  };

  const renderMedicineCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.medicineCard,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => navigation.navigate("EditMedicine", { medicine: item })}
      activeOpacity={0.7}
    >
      <View style={styles.medicineCardContent}>
        <View
          style={[
            styles.medicineIconBg,
            { backgroundColor: theme.colors.primary + "15" },
          ]}
        >
          <Text style={styles.medicineIcon}>💊</Text>
        </View>

        <View style={styles.medicineInfo}>
          <Text style={[styles.medicineName, { color: theme.colors.text }]}>
            {item.nome}
          </Text>
          <Text
            style={[styles.medicineDosage, { color: theme.colors.subText }]}
          >
            {item.dosagem || "Sem dosagem"}
          </Text>
          {item.horarios && item.horarios.length > 0 && (
            <Text
              style={[styles.medicineSchedule, { color: theme.colors.primary }]}
            >
              🕐 {item.horarios.join(" • ")}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.medicineActions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleTakeMedicine(item);
          }}
        >
          <Text style={styles.actionBtnText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.colors.danger + "20" },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
        >
          <Text style={styles.actionBtnIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar por nome ou dosagem..."
            placeholderTextColor={theme.colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {["Todos", "Ativos", "Finalizados"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterType === filter
                    ? theme.colors.primary
                    : theme.colors.cardBackground,
                borderColor:
                  filterType === filter
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={() => setFilterType(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterType === filter ? "#fff" : theme.colors.subText,
                },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Counter */}
      <View style={styles.counterContainer}>
        <Text style={[styles.counterText, { color: theme.colors.text }]}>
          {filteredMedicamentos.length}{" "}
          {filteredMedicamentos.length === 1
            ? "medicamento encontrado"
            : "medicamentos encontrados"}
        </Text>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.subText }]}>
          Carregando mais...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyState,
        { backgroundColor: theme.colors.cardBackground },
      ]}
    >
      <Text style={styles.emptyIcon}>💊</Text>
      <Text style={[styles.emptyText, { color: theme.colors.subText }]}>
        {searchQuery.trim() || filterType !== "Todos"
          ? "Nenhum medicamento encontrado com esses filtros"
          : "Nenhum medicamento cadastrado"}
      </Text>
      {(searchQuery.trim() || filterType !== "Todos") && (
        <TouchableOpacity
          style={[
            styles.clearFiltersButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => {
            setSearchQuery("");
            setFilterType("Todos");
          }}
        >
          <Text style={styles.clearFiltersText}>Limpar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: theme.colors.cardBackground },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: theme.colors.text }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Meus Medicamentos
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.subText }]}>
            Carregando medicamentos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedicamentos}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchMedicamentos(false)}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 20,
    color: "#999",
    paddingHorizontal: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  counterContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  medicineCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medicineCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  medicineIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  medicineIcon: {
    fontSize: 28,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 14,
    marginBottom: 4,
  },
  medicineSchedule: {
    fontSize: 13,
    fontWeight: "600",
  },
  medicineActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  clearFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  clearFiltersText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});