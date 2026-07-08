"use client";

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
import { IconArrowLeft, IconHome } from "@tabler/icons-react";

import logo from "@/public/images/logo.png";

export default function NotFound() {
  const router = useRouter();
  const theme = useMantineTheme();

  return (
    <Box
      bg="green.0"
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
            border: `1px solid ${theme.colors.green[1]}`,
            boxShadow: theme.other.customBoxShadow,
          }}
        >
          <Stack align="center" gap="md" ta="center">
            <Image src={logo} alt="Bais Andan Law Firm" width={86} height={86} />

            <Text fw={700} c="green.4" size="sm">
              404
            </Text>

            <Title order={1} c="green.9" size="h2">
              Page not found
            </Title>

            <Text c="dimmed" maw={440}>
              The page you are looking for may have been moved, removed, or is
              no longer available.
            </Text>

            <Group justify="center" mt="sm" gap="sm">
              <Button
                variant="light"
                color="green"
                leftSection={<IconArrowLeft size={18} />}
                onClick={() => router.back()}
              >
                Go Back
              </Button>

              <Button
                color="green"
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
