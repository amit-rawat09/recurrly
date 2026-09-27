import { Stack } from "expo-router";
import moduleName from "../../global.css";
import { HeaderShownContext } from "expo-router/build/react-navigation";
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
