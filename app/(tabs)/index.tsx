import { useUser } from "@clerk/expo";
import "../../global.css";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from "../../constants/images";
import {
  HOME_BALANCE,
  UPCOMING_SUBSCRIPTIONS,
} from "../../constants/data";
import { icons } from "../../constants/icon";
import { formatCurrency } from "../../lib/utils";
import dayjs from "dayjs";
import ListHeading from "../component/ListHeading";
import UpcommingSubscription from "../component/UpcommingSubscription";
import SubscriptionCard from "../component/SubscriptionCard";
import CreateSubscriptionModal from "../component/CreateSubscriptionModal";
import { useState } from "react";
import { useSubscriptions } from "../../lib/subscriptions-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const { user } = useUser();
  const { subscriptions, addSubscription } = useSubscriptions();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [failedProfileImageUrl, setFailedProfileImageUrl] = useState<string | null>(null);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const profileImageUrl = user?.imageUrl;
  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.firstName?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "there";

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={profileImageUrl && failedProfileImageUrl !== profileImageUrl
                    ? { uri: profileImageUrl }
                    : images.avatar}
                  onError={() => setFailedProfileImageUrl(profileImageUrl ?? null)}
                  accessibilityLabel={`${displayName}'s profile photo`}
                  className="home-avatar"
                />
                <Text className="home-user-name">{displayName}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
                onPress={() => setIsCreateModalVisible(true)}
                hitSlop={8}
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>
              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD/YYYY")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />

              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <UpcommingSubscription {...item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>
            <ListHeading title="All Subscriptions" />
          </>
        )}
        className="flex-1"
        data={subscriptions}
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
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet.</Text>
        }
        contentContainerClassName="pb-26"
      />
      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={addSubscription}
      />
    </SafeAreaView>
  );
}
