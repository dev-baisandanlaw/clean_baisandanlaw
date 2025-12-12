"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  em,
  Flex,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { appNotifications } from "@/utils/notifications/notifications";
import { useRouter } from "nextjs-toploader/app";

const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

export default function Page() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const shrink = useMediaQuery(`(max-width: ${em(576)})`);

  const [isGettingCode, setIsGettingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [successfulCodeSent, setSuccessfulCodeSent] = useState(false);
  const [error, setError] = useState<string>("");

  const form = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: (value) =>
        emailRegex.test(value) ? null : "Invalid email address",
    },

    validateInputOnChange: true,
  });

  const resetForm = useForm({
    initialValues: {
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },

    validate: {
      newPassword: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmNewPassword: (value, values) =>
        value !== values.newPassword ? "Passwords did not match" : null,
    },

    validateInputOnChange: true,
  });

  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsGettingCode(true);

    await signIn
      ?.create({
        strategy: "reset_password_email_code",
        identifier: form.values.email,
      })
      .then(() => {
        appNotifications.success({
          title: "Code sent successfully",
          message: "Please check your email for the code.",
        });
        setSuccessfulCodeSent(true);
        setError("");
      })
      .catch((err) => {
        setError(
          err.errors?.[0].longMessage || "An error occurred. Please try again."
        );
      })
      .finally(() => setIsGettingCode(false));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsResettingPassword(true);

    await signIn
      ?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetForm.values.code,
        password: resetForm.values.newPassword,
      })
      .then((res) => {
        if (res.status === "complete") {
          appNotifications.success({
            title: "Password reset successfully",
            message: "Redirecting to the requested page...",
          });

          setActive({ session: res.createdSessionId });
          router.push("/appointments");
        }
      })
      .catch((err) => {
        setError(
          err.errors?.[0].longMessage || "An error occurred. Please try again."
        );
      })
      .finally(() => setIsResettingPassword(false));
  };

  if (!isLoaded) return null;

  return (
    <Container fluid p={0}>
      <Flex justify="center" align="center" mih="100vh" bg="green.8">
        <Flex
          direction={{
            base: "column-reverse",
            xs: "row",
          }}
          w="100%"
          bg="green.4"
          maw={800}
          mx={16}
          style={(theme) => ({
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          })}
        >
          <Box
            flex={1}
            bg="white"
            style={(theme) => ({
              borderTopLeftRadius: shrink ? 0 : theme.radius.md,
              borderBottomLeftRadius: theme.radius.md,
              borderBottomRightRadius: shrink ? theme.radius.md : 0,
            })}
            p={32}
          >
            <header>
              <Title order={3} mb={6}>
                Forgot Password
              </Title>
              {!successfulCodeSent && (
                <Text mb={16}>
                  Please enter your email address below. We will send you a code
                  to reset your password.
                </Text>
              )}
              {successfulCodeSent && (
                <Stack gap={4} mb={16}>
                  <Text>We&apos;ve sent a verification code to </Text>
                  <Text c="green.4" fw={700} mb={16}>
                    {form.values.email}
                  </Text>
                </Stack>
              )}

              {!!error && (
                <Alert title={error} variant="light" color="red.9" mb={16} />
              )}
            </header>

            {!successfulCodeSent && (
              <form onSubmit={handleGetCode}>
                <Stack gap={12}>
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    {...form.getInputProps("email")}
                  />
                </Stack>

                <Button
                  fullWidth
                  mt={16}
                  loading={isGettingCode}
                  disabled={!form.isValid()}
                  type="submit"
                >
                  Get Code
                </Button>
              </form>
            )}

            {successfulCodeSent && (
              <form onSubmit={handleResetPassword}>
                <Stack gap={12}>
                  <Text mb={-8}>Code</Text>
                  <PinInput
                    type="number"
                    length={6}
                    // size={shrinkLarger ? "xs" : "lg"}
                    styles={{
                      root: {
                        flexWrap: "wrap",
                      },
                    }}
                    {...resetForm.getInputProps("code")}
                  />

                  <PasswordInput
                    label={<Text>Password </Text>}
                    placeholder="********"
                    mb={12}
                    {...resetForm.getInputProps("newPassword")}
                  />

                  <PasswordInput
                    label={<Text>Confirm password </Text>}
                    placeholder="********"
                    mb={12}
                    {...resetForm.getInputProps("confirmNewPassword")}
                  />

                  <Button
                    fullWidth
                    mt={16}
                    loading={isResettingPassword}
                    disabled={!resetForm.isValid()}
                    type="submit"
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setSuccessfulCodeSent(false);
                      resetForm.reset();
                      form.reset();
                      setError("");
                    }}
                  >
                    Back
                  </Button>
                </Stack>
              </form>
            )}
          </Box>

          <Flex
            flex={1}
            maw={{ base: "100%", xs: "40%" }}
            bg="green.4"
            justify="center"
            align="center"
            style={(theme) => ({
              borderTopRightRadius: theme.radius.md,
              borderBottomRightRadius: theme.radius.md,
              borderTopLeftRadius: shrink ? theme.radius.md : 0,
            })}
          >
            <Image
              src={logo}
              alt="BaisAndan Law Offices"
              width={120}
              height={120}
            />
          </Flex>
        </Flex>
      </Flex>
    </Container>
  );
}
