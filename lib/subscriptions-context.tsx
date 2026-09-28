import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { HOME_SUBSCRIPTIONS } from "../constants/data";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => [
    ...HOME_SUBSCRIPTIONS,
  ]);

  const addSubscription = useCallback((subscription: Subscription) => {
    setSubscriptions((currentSubscriptions) => [subscription, ...currentSubscriptions]);
  }, []);

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) {
    throw new Error("useSubscriptions must be used inside SubscriptionsProvider");
  }
  return context;
}
