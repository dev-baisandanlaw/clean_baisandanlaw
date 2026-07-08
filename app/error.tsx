"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconHome, IconRefresh } from "@tabler/icons-react";

import logo from "@/public/images/logo.png";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const theme = useMantineTheme();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      bg="red.0"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Container size="sm" px="md">
        <Paper
          radius={8}
          p={{ base: 28, sm: 40 }}
          shadow="sm"
          style={{
            border: `1px solid ${theme.colors.red[1]}`,
            boxShadow: theme.other.customBoxShadow,
          }}
        >
          <Stack align="center" gap="md" ta="center">
            <Image
              src={logo}
              alt="Bais Andan Law Firm"
              width={86}
              height={86}
            />

            <Title order={1} c="red.9" size="h2">
              Something went wrong
            </Title>

            <Text c="dimmed" maw={440}>
              We could not load this page right now. Please try again or return
              to the home page.
            </Text>

            <Group justify="center" mt="sm" gap="sm">
              <Button
                color="red"
                variant="light"
                leftSection={<IconRefresh size={18} />}
                onClick={reset}
              >
                Try Again
              </Button>

              <Button
                color="red"
                leftSection={<IconHome size={18} />}
                onClick={() => router.push("/")}
              >
                Go Home
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
