"use client";

import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  em,
  Flex,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import Image from "next/image";
import logo from "@/public/images/logo.png";
import { IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ClerkAPIError } from "@clerk/types";
import { useMediaQuery } from "@mantine/hooks";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const shrink = useMediaQuery(`(max-width: ${em(576)})`);

  const { isLoaded, signIn, setActive } = useSignIn();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>([]);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoggingIn(true);
    setErrors([]);

    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/");
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
    } finally {
      setIsLoggingIn(false);
    }
  };

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
                Login
              </Title>
              <Text mb={16}>Hi, Welcome back!</Text>

              {!!errors.length &&
                errors.map(({ code, longMessage }) => (
                  <Alert
                    key={code}
                    title={longMessage}
                    variant="light"
                    color="red.9"
                    icon={<IconAlertCircle />}
                    styles={{ icon: { marginBlock: "auto" } }}
                    mb={16}
                  />
                ))}
            </header>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap={12}>
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  {...form.getInputProps("email")}
                />

                <Stack gap={0}>
                  <PasswordInput
                    label="Password"
                    placeholder="********"
                    {...form.getInputProps("password")}
                  />

                  <Anchor
                    href="/"
                    size="xs"
                    tabIndex={-1}
                    ml="auto"
                    underline="hover"
                  >
                    Forgot password
                  </Anchor>
                </Stack>
              </Stack>

              <Button
                fullWidth
                mt={16}
                loading={isLoggingIn}
                disabled={!form.values.email || !form.values.password}
                type="submit"
              >
                Sign In
              </Button>
            </form>

            <Text size="xs" mt={16} mx="auto">
              Don&apos;t have an account?{" "}
              <Anchor underline="always" href="/sign-up" size="sm">
                Create an account
              </Anchor>
            </Text>
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
