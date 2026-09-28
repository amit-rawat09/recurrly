import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from "react-native";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { icons } from "../../constants/icon";

const categories = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const categoryColors: Record<(typeof categories)[number], string> = {
  Entertainment: "#f5c6c8",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#c9e2f2",
  Music: "#f4d3a2",
  Other: "#eadfc4",
};

type Frequency = "Monthly" | "Yearly";

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void | Promise<void>;
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<(typeof categories)[number]>("Entertainment");
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    setErrors({});
    setSubmitError(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const nextErrors: { name?: string; price?: string } = {};
    const trimmedName = name.trim();
    const parsedPrice = Number(price);

    if (!trimmedName) nextErrors.name = "Enter a subscription name.";
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = "Enter a price greater than 0.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const startDate = dayjs();
    const newSubscription: Subscription = {
      id: `subscription-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate: startDate.toISOString(),
      renewalDate: startDate
        .add(1, frequency === "Monthly" ? "month" : "year")
        .toISOString(),
      icon: icons.wallet,
      billing: frequency,
      color: categoryColors[category],
    };

    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await onCreate(newSubscription);
      resetForm();
      onClose();
    } catch {
      setSubmitError("We couldn’t add this subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="modal-overlay justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close new subscription form"
          className="absolute inset-0"
          onPress={handleClose}
        />
        <KeyboardAvoidingView
          className="w-full"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="modal-container">
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="modal-close"
                onPress={handleClose}
                hitSlop={8}
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="modal-body"
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  accessibilityLabel="Subscription name"
                  className={clsx("auth-input", errors.name && "auth-input-error")}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="e.g. Spotify Premium"
                  placeholderTextColor="#77776f"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.name ? <Text className="auth-error">{errors.name}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  accessibilityLabel="Subscription price"
                  className={clsx("auth-input", errors.price && "auth-input-error")}
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value);
                    if (errors.price) setErrors((current) => ({ ...current, price: undefined }));
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#77776f"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                {errors.price ? <Text className="auth-error">{errors.price}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((option) => {
                    const selected = frequency === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        className={clsx("picker-option", selected && "picker-option-active")}
                        onPress={() => setFrequency(option)}
                      >
                        <Text className={clsx(
                          "picker-option-text",
                          selected && "picker-option-text-active",
                        )}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {categories.map((option) => {
                    const selected = category === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        className={clsx("category-chip", selected && "category-chip-active")}
                        onPress={() => setCategory(option)}
                      >
                        <Text className={clsx(
                          "category-chip-text",
                          selected && "category-chip-text-active",
                        )}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {submitError ? (
                <Text accessibilityRole="alert" className="auth-error">
                  {submitError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitting }}
                className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                disabled={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="auth-button-text">Add subscription</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
