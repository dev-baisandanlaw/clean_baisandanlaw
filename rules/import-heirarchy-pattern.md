# Next.js Import Hierarchy Standard

1. React Core. Always first.

2. Next.js Core

- Framework-level imports only.

3. External / Third-Party Libraries

- Anything from node_modules that is not Next or React.

4. Absolute Internal Imports (App-Level)

- Imports using @/ or configured path aliases.

5. Relative Imports (Same Module Scope)

- Only for files tightly coupled to the current file.
- Order inside this section:
  ./Component
  ./hooks
  ./utils
  ./types
  ./styles
  CSS modules last

6. Type-Only Imports

example:
// 1️⃣ React
import { useEffect, useState } from "react"

// 2️⃣ Next
import Image from "next/image"
import { useRouter } from "next/navigation"

// 3️⃣ Third-party
import clsx from "clsx"
import { useQuery } from "@tanstack/react-query"

// 4️⃣ Internal absolute
import { Header } from "@/components/layout/Header"
import { useAuth } from "@/hooks/useAuth"
import { formatDate } from "@/utils/formatDate"

// 5️⃣ Relative
import { Form } from "./Form"
import styles from "./styles.module.css"
