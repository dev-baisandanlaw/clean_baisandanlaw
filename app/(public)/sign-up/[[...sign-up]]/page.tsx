"use client";

import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  em,
  Flex,
  NumberInput,
  PasswordInput,
  PinInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import logo from "@/public/images/logo.png";
import Image from "next/image";
import { IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { ClerkAPIError } from "@clerk/types";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import axios from "axios";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";

export default function Page() {
  const shrink = useMediaQuery(`(max-width: ${em(576)})`);
  const shrinkLarger = useMediaQuery(`(max-width: ${em(768)})`);

  const router = useRouter();

  const { isLoaded, signUp, setActive } = useSignUp();

  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<ClerkAPIError[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
      birthday: "",
    },

    validate: {
      firstName: (value) => (!value.length ? "First name is required" : null),
      lastName: (value) => (!value.length ? "Last name is required" : null),
      phoneNumber: (value) =>
        !value?.toString().length ? "Phone number is required" : null,
      email: (value) =>
        !value.length
          ? "Email is required"
          : /^\S+@\S+$/.test(value)
            ? null
            : "Invalid Email",
      address: (value) => (!value.length ? "Full address is required" : null),
      birthday: (value) => (!value.length ? "Birthday is required" : null),
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords did not match" : null,
    },

    validateInputOnChange: true,
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setErrors([]);

    if (!isLoaded) return;

    try {
      await signUp.create({
        firstName: values.firstName,
        lastName: values.lastName,
        emailAddress: values.email,
        password: values.password,

        unsafeMetadata: {
          role: "client",
          phoneNumber: values.phoneNumber,
          fullAddress: values.address,
          birthday: dayjs(values.birthday).format("YYYY-MM-DD"),

          subscription: {
            count: 0,
            isSubscribed: false,
            subscribedStartDate: null,
            subscribedEndDate: null,
          },
        },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setIsVerifying(true);
    } catch (err) {
      if ((err as { message: string }).message.includes("already signed in")) {
        setErrors([
          {
            code: "Error",
            message:
              "You are already signed in. Please refresh the page and sign out and try again.",
            longMessage:
              "You are already signed in. Please refresh the page and sign out and try again.",
          },
        ]);
        return;
      }
      setErrors(isClerkAPIResponseError(err) ? err.errors : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setErrors([]);

    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await axios.post("/api/clerk/organization/post-user-to-org", {
        user_id: completeSignUp.createdUserId,
        organization_id: CLERK_ORG_IDS.client,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        appNotifications.success({
          title: "Account created successfully",
          message: "You can now sign in to your account",
        });
        router.push("/");
      }
    } catch (error) {
      setErrors(isClerkAPIResponseError(error) ? error.errors : []);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid p={0}>
      <Flex justify="center" align="center" mih="100vh" bg="green.8">
        <Flex
          direction={{
            base: "column",
            xs: "row",
          }}
          w="100%"
          bg="green.4"
          maw={800}
          mx={16}
          my={8}
          style={(theme) => ({
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          })}
        >
          <Flex
            flex={1}
            maw={{ base: "100%", xs: "40%" }}
            bg="green.4"
            justify="center"
            align="center"
            style={(theme) => ({
              borderTopLeftRadius: theme.radius.md,
              borderBottomLeftRadius: theme.radius.md,
              borderTopRightRadius: shrink ? theme.radius.md : 0,
            })}
          >
            <Image
              src={logo}
              alt="BaisAndan Law Offices"
              width={120}
              height={120}
            />
          </Flex>

          <Box
            flex={1}
            bg="white"
            style={(theme) => ({
              borderTopRightRadius: shrink ? 0 : theme.radius.md,
              borderBottomRightRadius: theme.radius.md,
              borderBottomLeftRadius: shrink ? theme.radius.md : 0,
            })}
          >
            <ScrollArea h="100%" mah={700}>
              {!isVerifying ? (
                <Box p={16}>
                  <header>
                    <Title order={3} mb={6}>
                      Sign Up
                    </Title>
                    <Text mb={16}>
                      Hello there! Let&apos;s get you started.
                    </Text>

                    {!!errors.length &&
                      errors.map(({ code, message }) => (
                        <Alert
                          key={code}
                          title={message}
                          variant="light"
                          color="red.9"
                          icon={<IconAlertCircle />}
                          styles={{ icon: { marginBlock: "auto" } }}
                          mb={16}
                        />
                      ))}
                  </header>

                  <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="xs">
                      <Flex
                        gap={6}
                        direction={{
                          base: "column",
                          xs: "row",
                        }}
                      >
                        <TextInput
                          w="100%"
                          withAsterisk
                          label="First name"
                          placeholder="John"
                          {...form.getInputProps("firstName")}
                        />
                        <TextInput
                          w="100%"
                          withAsterisk
                          label="Last name"
                          placeholder="Doe"
                          {...form.getInputProps("lastName")}
                        />
                      </Flex>

                      <Flex
                        gap={6}
                        direction={{
                          base: "column",
                          xs: "row",
                        }}
                      >
                        <NumberInput
                          w="100%"
                          withAsterisk
                          hideControls
                          leftSection={
                            <Text size="sm" c="black">
                              +63
                            </Text>
                          }
                          allowNegative={false}
                          label="Phone number"
                          maxLength={10}
                          placeholder="912 345 6789"
                          {...form.getInputProps("phoneNumber")}
                        />

                        <TextInput
                          w="100%"
                          withAsterisk
                          label="Email"
                          placeholder="your@email.com"
                          {...form.getInputProps("email")}
                        />
                      </Flex>

                      <Flex
                        gap={6}
                        direction={{
                          base: "column",
                          xs: "row",
                        }}
                      >
                        <TextInput
                          w="100%"
                          withAsterisk
                          label="Full address"
                          placeholder="House, street, city, province"
                          {...form.getInputProps("address")}
                        />

                        <DateInput
                          w="100%"
                          withAsterisk
                          placeholder="January 01, 2000"
                          label="Birthday"
                          {...form.getInputProps("birthday")}
                        />
                      </Flex>

                      <PasswordInput
                        withAsterisk
                        label="Password"
                        placeholder="********"
                        {...form.getInputProps("password")}
                      />

                      <PasswordInput
                        withAsterisk
                        label="Confirm password"
                        placeholder="********"
                        {...form.getInputProps("confirmPassword")}
                      />
                    </Stack>

                    <Button
                      type="submit"
                      fullWidth
                      mt={12}
                      loading={isLoading}
                      disabled={!form.isValid()}
                    >
                      Sign Up
                    </Button>
                  </form>

                  <Text size="xs" mt={16} mx="auto">
                    Already have an account?{" "}
                    <Anchor underline="always" href="/sign-in" size="sm">
                      Sign in
                    </Anchor>
                  </Text>
                </Box>
              ) : (
                <Flex justify="center" direction="column" p={32} align="center">
                  <header style={{ textAlign: "center" }}>
                    <Title order={3} mb={6}>
                      Verify your email
                    </Title>
                    <Text>We&apos;ve sent a verification code to </Text>
                    <Text c="green.4" fw={700} mb={16}>
                      {form.values.email}
                    </Text>
                  </header>

                  {errors.map(({ code, longMessage }) => (
                    <Alert
                      key={code}
                      title={longMessage}
                      variant="light"
                      color="red.9"
                      icon={<IconAlertCircle />}
                      styles={{ icon: { marginBlock: "auto" } }}
                      w="100% "
                      mb={16}
                    />
                  ))}

                  <PinInput
                    type="number"
                    length={6}
                    size={shrinkLarger ? "xs" : "lg"}
                    styles={{
                      root: {
                        justifyContent: "center",
                        flexWrap: "wrap",
                      },
                    }}
                    value={code}
                    onChange={(value) => setCode(value)}
                    disabled={errors.some(({ longMessage }) =>
                      longMessage?.includes("Too many failed attempts.")
                    )}
                  />

                  <Button
                    onClick={handleVerify}
                    mt={16}
                    fullWidth
                    loading={isLoading}
                    disabled={
                      code.length !== 6 ||
                      errors.some(({ longMessage }) =>
                        longMessage?.includes("Too many failed attempts.")
                      )
                    }
                  >
                    Verify
                  </Button>
                  <Button
                    mt={8}
                    fullWidth
                    variant="outline"
                    onClick={() => {
                      setIsVerifying(false);
                      setCode("");
                      setErrors([]);
                    }}
                  >
                    Back
                  </Button>
                </Flex>
              )}
            </ScrollArea>
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
}
