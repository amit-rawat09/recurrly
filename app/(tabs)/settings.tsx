import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { colors } from "../../constants/theme";
import { getAuthErrorMessage } from "../../lib/auth";

const SafeAreaView = styled(RNSafeAreaView);

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string>();

  const handleSignOut = async () => {
    setError(undefined);
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5" edges={["top", "bottom"]}>
      <View className="settings-content">
        <Text className="settings-title">Settings</Text>
        <View className="settings-account-card">
          <Text className="settings-section-label">SIGNED IN AS</Text>
          <Text className="settings-account-name">
            {user?.fullName || user?.username || "Your account"}
          </Text>
          <Text className="settings-account-email">
            {user?.primaryEmailAddress?.emailAddress ?? ""}
          </Text>
        </View>

        {error ? (
          <View accessibilityRole="alert" className="auth-error-box">
            <Text className="auth-error">{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningOut }}
          className={isSigningOut ? "settings-signout settings-signout-disabled" : "settings-signout"}
          disabled={isSigningOut}
          onPress={handleSignOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Text className="settings-signout-text">Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
