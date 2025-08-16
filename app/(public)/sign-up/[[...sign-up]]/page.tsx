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
import { toast } from "react-toastify";
import { useMediaQuery } from "@mantine/hooks";
import axios from "axios";
import { CLERK_ORG_IDS } from "@/constants/constants";

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
    },

    validate: {
      firstName: (value) => (!value.length ? "First name is required" : null),
      lastName: (value) => (!value.length ? "Last name is required" : null),
      email: (value) =>
        !value.length
          ? "Email is required"
          : /^\S+@\S+$/.test(value)
          ? null
          : "Invalid Email",
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
          phoneNumber: values.phoneNumber,
        },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setIsVerifying(true);
    } catch (err) {
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
        toast.success("Account created successfully");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
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
            <ScrollArea h="100%" mah={620}>
              {!isVerifying ? (
                <Box p={32}>
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
                    <Box>
                      <Flex gap={6}>
                        <TextInput
                          w="100%"
                          label="First name"
                          placeholder="John"
                          mb={12}
                          {...form.getInputProps("firstName")}
                        />
                        <TextInput
                          w="100%"
                          label="Last name"
                          placeholder="Doe"
                          mb={12}
                          {...form.getInputProps("lastName")}
                        />
                      </Flex>

                      <NumberInput
                        hideControls
                        leftSection={
                          <Text size="sm" c="black">
                            +63
                          </Text>
                        }
                        allowNegative={false}
                        label={
                          <Text>
                            Phone number{" "}
                            <Text span size="xs" c="gray.7">
                              (optional)
                            </Text>
                          </Text>
                        }
                        maxLength={10}
                        placeholder="912 345 6789"
                        mb={12}
                        {...form.getInputProps("phoneNumber")}
                      />

                      <TextInput
                        label={<Text>Email </Text>}
                        placeholder="your@email.com"
                        mb={12}
                        {...form.getInputProps("email")}
                      />

                      <PasswordInput
                        label={<Text>Password </Text>}
                        placeholder="********"
                        mb={12}
                        {...form.getInputProps("password")}
                      />

                      <PasswordInput
                        label={<Text>Confirm password </Text>}
                        placeholder="********"
                        mb={12}
                        {...form.getInputProps("confirmPassword")}
                      />
                    </Box>

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
