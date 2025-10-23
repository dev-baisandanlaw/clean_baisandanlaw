"use client";
import { Button, Container, Flex, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <Container fluid p={0}>
      <Flex
        direction="column"
        justify="center"
        align="center"
        mih="100vh"
        gap={16}
      >
        <Text>404 - Page Not Found</Text>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </Flex>
    </Container>
  );
}
