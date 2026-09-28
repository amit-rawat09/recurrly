import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import SubscriptionCard from "../component/SubscriptionCard";
import { useSubscriptions } from "../../lib/subscriptions-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function SubscriptionsScreen() {
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return subscriptions;

    return subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.plan,
        subscription.category,
        subscription.status,
        subscription.billing,
        subscription.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [query, subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5" edges={["top", "bottom"]}>
      <View className="subscriptions-screen">
        <View className="subscriptions-heading">
          <Text className="subscriptions-title">Subscriptions</Text>
          <Text className="subscriptions-subtitle">
            Keep track of the services you pay for.
          </Text>
        </View>

        <View className="subscription-search">
          <TextInput
            accessibilityLabel="Search subscriptions"
            className="subscription-search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Search subscriptions"
            placeholderTextColor="#77776f"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              className="subscription-search-clear"
              onPress={() => setQuery("")}
              hitSlop={8}
            >
              <Text className="subscription-search-clear-text">×</Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="subscriptions-count">
          {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? "subscription" : "subscriptions"}
        </Text>

        <FlatList
          className="flex-1"
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() =>
                setExpandedSubscriptionId((currentId) =>
                  currentId === item.id ? null : item.id,
                )
              }
            />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-28"
          ListEmptyComponent={
            <View className="subscriptions-empty">
              <Text className="subscriptions-empty-title">No matches found</Text>
              <Text className="subscriptions-empty-copy">
                Try another service, category, or status.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
