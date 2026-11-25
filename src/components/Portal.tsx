"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: ReactNode }) {
    return typeof document === "undefined" ? null : createPortal(children, document.body);
}
