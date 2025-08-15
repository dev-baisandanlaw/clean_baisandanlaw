import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";

import "./globals.css";

import {
  ColorSchemeScript,
  createTheme,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
// import AppShellComponent from "@/components/AppShellComponent";
import { ToastContainer } from "react-toastify";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bais Andan Law Firm",
  description: "Bais Andan Law Firm",
};

const theme = createTheme({
  fontFamily: openSans.style.fontFamily,

  colors: {
    green: [
      "#E6F2F0", // 50
      "#C2DDD7", // 100
      "#9AC6BA", // 200
      "#6EAD9B", // 300
      "#2B4E45", // 400 (primary)
      "#25453D", // 500
      "#1F3B35", // 600
      "#19322D", // 700
      "#142824", // 800
      "#0F1F1C", // 900
    ],
  },

  components: {
    Modal: {
      defaultProps: {
        closeOnEscape: false,
        closeOnClickOutside: false,
      },
    },
    Container: {
      styles: {
        root: {
          padding: 0,
        },
      },
    },

    LoadingOverlay: {
      defaultProps: {
        loaderProps: {
          type: "bars",
        },
      },
    },
  },

  primaryColor: "green",
  primaryShade: 4,

  other: {
    customBoxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
    customLighterGreen: "rgba(117, 161, 150, 0.5)",
    customViridian: "#207D66", // Primary Background / Header
    customEmerald: "#33D187", // Backgrounds / Sections /Accent Elements,
    customMaize: "#FCEC77", // CTA Buttons / Hyperlinks / Icons
    customPumpkin: "#D4AF37", // Accents / Highlights
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${openSans.variable}`}
        style={{ margin: 0, padding: 0 }}
      >
        <ToastContainer position="top-center" autoClose={2000} />
        <MantineProvider theme={theme}>
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: "#2B4E45",
              },
            }}
          >
            {children}
            {/* <AppShellComponent>{children}</AppShellComponent> */}
          </ClerkProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
