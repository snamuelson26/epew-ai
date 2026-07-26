"use client";

import { createContext } from "react";

import type { IBOS } from "./IBOS";

/**
 * React context containing the active IBOS runtime.
 *
 * The default value is null so useIBOS can detect when a component is
 * rendered outside IBOSProvider.
 */
export const IBOSContext =
  createContext<IBOS | null>(null);

IBOSContext.displayName = "IBOSContext";