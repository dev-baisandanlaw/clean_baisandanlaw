"use client";

import {
  AppShell,
  Box,
  Burger,
  Container,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import styles from "./Appshell.module.css";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { UserButton, useUser } from "@clerk/nextjs";
import { NAV_LINKS } from "@/constants/constants";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AppShellComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useMantineTheme();
  const [opened, { toggle, close }] = useDisclosure();
  const [mounted, setMounted] = useState(false);

  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const currentPath = NAV_LINKS.find(({ href }) => pathname.startsWith(href));

    if (
      user &&
      user?.unsafeMetadata?.role &&
      !currentPath?.roles.includes(user?.unsafeMetadata?.role as string)
    ) {
      router.push("/appointments");
    }
  }, [pathname, user, router]);

  useEffect(() => {
    if (isMobile) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!mounted) return null;

  return (
    <AppShell
      header={{ height: { base: 60 } }}
      navbar={{
        width: { md: 250 },
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
      zIndex={100}
      styles={{
        header: {
          boxShadow: theme.other.customBoxShadow,
          backgroundColor: isMobile ? "#2b4e45" : "white",
          border: "none",
          marginLeft: isMobile ? "5px" : "265px",
          marginRight: isMobile ? "5px" : "10px",
          marginTop: "5px",
          borderRadius: "10px",
        },
        navbar: {
          boxShadow: theme.other.customBoxShadow,
          backgroundColor: "#2b4e45",
          border: "none",
          marginTop: isMobile ? "10px" : "-55px",
          marginInline: !isMobile ? "5px" : opened ? "5px" : "0px",
          height: isMobile ? "calc(100vh - 80px)" : "98.5%",
          width: isMobile ? "calc(100vw - 10px)" : "250px",
          borderRadius: "10px",
          zIndex: 100,
        },
        main: {
          paddingLeft: isMobile ? 0 : 266,
          paddingBottom: 0,
          paddingTop: isMobile ? 60 : 70,
          paddingRight: isMobile ? 0 : 10,
        },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="md"
            size="sm"
            color="white"
          />

          <Text
            tt="capitalize"
            fw={600}
            c={isMobile ? "white" : "green.4"}
            ml={isMobile ? "auto" : "0px"}
            size="lg"
          >
            {pathname?.split("/")[1] || ""}
          </Text>

          <Box ml="auto">
            <UserButton showName={!isMobile} afterSignOutUrl="/sign-in" />
          </Box>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section mx="auto">
          <Image src={logo} alt="logo" width={75} height={75} />
        </AppShell.Section>

        <Divider my="sm" />

        <AppShell.Section component={ScrollArea}>
          {NAV_LINKS.filter((n) =>
            n.roles.includes(user?.unsafeMetadata?.role as string)
          ).map((link, i) => (
            <React.Fragment key={link.label}>
              <NavLink
                active
                component={Link}
                label={link.label}
                href={link.href}
                variant={
                  pathname === link.href || pathname.startsWith(link.href)
                    ? "filled"
                    : "light"
                }
                className={styles.appShellRoot}
                styles={{
                  label: {
                    color: "white",
                    fontWeight:
                      pathname === link.href || pathname.startsWith(link.href)
                        ? 700
                        : 600,
                    letterSpacing: 1.5,
                  },
                  root: {
                    borderRadius: 6,
                    backgroundColor:
                      pathname === link.href || pathname.startsWith(link.href)
                        ? theme.other.customLighterGreen
                        : "transparent",
                  },
                }}
                leftSection={<link.icon color="white" />}
                mb="sm"
              />

              {user?.unsafeMetadata?.role === "admin" &&
                i === NAV_LINKS.length - 3 && (
                  <Divider mt="md" label="Users" labelPosition="left" />
                )}
            </React.Fragment>
          ))}
        </AppShell.Section>

        <AppShell.Section mt="auto">
          <Text size="sm" c="white" ta="center">
            All rights reserved
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container
          fluid
          mih={isMobile ? `calc(100vh - 250px)` : `calc(100vh - 75px)`}
          mb={8}
          px={isMobile ? "5px" : 16}
          py={16}
          style={{
            borderRadius: isMobile ? 0 : 10,
            boxShadow: theme.other.customBoxShadow,
          }}
        >
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
