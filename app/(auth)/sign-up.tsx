import { useSignUp } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AuthField, AuthShell } from "../component/AuthShell";
import { getAuthErrorMessage, validateEmail } from "../../lib/auth";
import { colors } from "../../constants/theme";

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || fetchStatus === "fetching";

  const handleSignUp = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }
    if (password.length < 8) {
      setFieldError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Your passwords don’t match.");
      return;
    }

    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);
    try {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        ...(parts[0] ? { firstName: parts[0] } : {}),
        ...(parts.length > 1 ? { lastName: parts.slice(1).join(" ") } : {}),
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }

      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        setFormError(getAuthErrorMessage(sendResult.error));
        return;
      }
      setIsVerifying(true);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setFieldError("Enter the verification code we emailed you.");
      return;
    }
    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      if (signUp.status !== "complete") {
        setFormError("Your email is verified, but the account still needs another step. Please try again.");
        return;
      }
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setFormError(getAuthErrorMessage(finalizeError));
        return;
      }
      router.replace("/(tabs)");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setFormError(undefined);
    setSubmitting(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) setFormError(getAuthErrorMessage(error));
      else setFormError("A fresh verification code is on its way.");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={isVerifying ? "Check your inbox" : "Create your account"}
      subtitle={isVerifying
        ? `We sent a verification code to ${email.trim()}. Enter it below to finish setting up your account.`
        : "Stay on top of every renewal with one simple account."}
    >
      <View className="auth-form">
        {isVerifying ? (
          <>
            <AuthField
              label="Email verification code"
              value={code}
              onChangeText={(value) => { setCode(value); setFieldError(undefined); }}
              placeholder="Enter the 6-digit code"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              error={fieldError}
            />
            <Pressable accessibilityRole="button" disabled={busy} onPress={handleResend}>
              <Text className="auth-resend-link">Resend verification code</Text>
            </Pressable>
          </>
        ) : (
          <>
            <AuthField
              label="Name (optional)"
              value={name}
              onChangeText={setName}
              placeholder="How should we address you?"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
            <AuthField
              label="Email"
              value={email}
              onChangeText={(value) => { setEmail(value); setFieldError(undefined); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={fieldError && validateEmail(email) ? fieldError : undefined}
            />
            <AuthField
              label="Password"
              value={password}
              onChangeText={(value) => { setPassword(value); setFieldError(undefined); }}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              error={fieldError && email.trim() && !validateEmail(email) && password.length < 8 ? fieldError : undefined}
            />
            <AuthField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={(value) => { setConfirmPassword(value); setFieldError(undefined); }}
              placeholder="Enter your password again"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleSignUp}
              error={fieldError && password.length >= 8 && password !== confirmPassword ? fieldError : undefined}
            />
            <Text className="auth-helper">
              We’ll email you a one-time code to verify your address.
            </Text>
          </>
        )}

        {formError ? (
          <View accessibilityRole="alert" className={formError.startsWith("A fresh") ? "auth-success-box" : "auth-error-box"}>
            <Text className={formError.startsWith("A fresh") ? "auth-success" : "auth-error"}>{formError}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          className={busy ? "auth-button auth-button-disabled" : "auth-button"}
          disabled={busy}
          onPress={isVerifying ? handleVerify : handleSignUp}
        >
          {busy ? <ActivityIndicator color={colors.primary} /> : (
            <Text className="auth-button-text">{isVerifying ? "Verify email" : "Create account"}</Text>
          )}
        </Pressable>
      </View>
      <View className="auth-link-row">
        <Text className="auth-link-copy">Already have an account?</Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable accessibilityRole="link"><Text className="auth-link">Sign in</Text></Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
