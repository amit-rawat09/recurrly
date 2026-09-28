import { useSignIn } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AuthField, AuthShell } from "../component/AuthShell";
import { getAuthErrorMessage, validateEmail } from "../../lib/auth";
import { colors } from "../../constants/theme";

type VerificationMode = "none" | "device-trust" | "mfa";
type MfaMethod = "email_code" | "phone_code" | "totp" | "backup_code";

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<VerificationMode>("none");
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>("totp");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || fetchStatus === "fetching";

  const finishSignIn = async () => {
    await signIn.finalize();
    router.replace("/(tabs)");
  };

  const handleSignIn = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }
    if (!password) {
      setFieldError("Enter your password.");
      return;
    }

    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);
    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
      } else if (signIn.status === "complete") {
        await finishSignIn();
      } else if (signIn.status === "needs_client_trust") {
        const emailFactor = signIn.supportedSecondFactors?.some(
          (factor) => factor.strategy === "email_code",
        );
        if (!emailFactor) {
          setFormError("This account needs another verification method. Contact support for help signing in.");
        } else {
          const result = await signIn.mfa.sendEmailCode();
          if (result.error) setFormError(getAuthErrorMessage(result.error));
          else setMode("device-trust");
        }
      } else if (signIn.status === "needs_second_factor") {
        const factors = signIn.supportedSecondFactors ?? [];
        const method: MfaMethod | undefined = factors.some((factor) => factor.strategy === "totp")
          ? "totp"
          : factors.some((factor) => factor.strategy === "phone_code")
            ? "phone_code"
            : factors.some((factor) => factor.strategy === "backup_code")
              ? "backup_code"
              : undefined;
        if (!method) {
          setFormError("This account needs a verification method this app doesn’t support yet. Contact support for help.");
        } else {
          setMfaMethod(method);
          setMode("mfa");
          if (method === "phone_code") {
            const result = await signIn.mfa.sendPhoneCode();
            if (result.error) setFormError(getAuthErrorMessage(result.error));
          }
        }
      } else {
        setFormError("We couldn’t complete sign in. Please try again.");
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setFieldError("Enter the verification code.");
      return;
    }
    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);
    try {
      const result = mode === "device-trust"
        ? await signIn.mfa.verifyEmailCode({ code: code.trim() })
        : mfaMethod === "phone_code"
          ? await signIn.mfa.verifyPhoneCode({ code: code.trim() })
          : mfaMethod === "backup_code"
            ? await signIn.mfa.verifyBackupCode({ code: code.trim() })
            : await signIn.mfa.verifyTOTP({ code: code.trim() });
      if (result.error) {
        setFormError(getAuthErrorMessage(result.error));
      } else if (signIn.status === "complete") {
        await finishSignIn();
      } else {
        setFormError("That code couldn’t complete sign in. Check it and try again.");
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    signIn.reset();
    setMode("none");
    setCode("");
    setFormError(undefined);
    setFieldError(undefined);
  };

  const verifying = mode !== "none";
  const title = verifying ? "Verify it’s you" : "Welcome back";
  const subtitle = verifying
    ? mode === "device-trust"
      ? `Enter the code we sent to ${email.trim()}.`
      : "Enter the code from your verification method to continue."
    : "Sign in to keep your subscriptions in sync.";

  return (
    <AuthShell title={title} subtitle={subtitle}>
      <View className="auth-form">
        {verifying ? (
          <>
            <AuthField
              label="Verification code"
              value={code}
              onChangeText={(value) => { setCode(value); setFieldError(undefined); }}
              placeholder="Enter your code"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              error={fieldError}
            />
            {mfaMethod === "totp" && mode === "mfa" ? (
              <Text className="auth-helper">Use the code shown in your authenticator app.</Text>
            ) : null}
          </>
        ) : (
          <>
            <AuthField
              label="Email"
              value={email}
              onChangeText={(value) => { setEmail(value); setFieldError(undefined); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={fieldError}
            />
            <AuthField
              label="Password"
              value={password}
              onChangeText={(value) => { setPassword(value); setFieldError(undefined); }}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
              error={fieldError && !validateEmail(email) ? fieldError : undefined}
            />
          </>
        )}

        {formError ? (
          <View accessibilityRole="alert" className="auth-error-box">
            <Text className="auth-error">{formError}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          className={busy ? "auth-button auth-button-disabled" : "auth-button"}
          disabled={busy}
          onPress={verifying ? handleVerify : handleSignIn}
        >
          {busy ? <ActivityIndicator color={colors.primary} /> : (
            <Text className="auth-button-text">{verifying ? "Verify and continue" : "Sign in"}</Text>
          )}
        </Pressable>

        {verifying ? (
          <Pressable accessibilityRole="button" className="auth-back-button" onPress={restart}>
            <Text className="auth-helper">Use a different account</Text>
          </Pressable>
        ) : null}
      </View>
      {!verifying ? (
        <View className="auth-link-row">
          <Text className="auth-link-copy">New to Recurrly?</Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable accessibilityRole="link"><Text className="auth-link">Create an account</Text></Pressable>
          </Link>
        </View>
      ) : null}
    </AuthShell>
  );
}
