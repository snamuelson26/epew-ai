"use client";

import { useContext } from "react";

import type {
  IBOSEngineName,
  IBOSEngines,
} from "./IBOS";
import { IBOSContext } from "./IBOSContext";

/**
 * Returns the active IBOS runtime.
 *
 * This hook must be used within IBOSProvider.
 */
export function useIBOS() {
  const ibos = useContext(IBOSContext);

  if (!ibos) {
    throw new Error(
      "useIBOS must be used inside an IBOSProvider.",
    );
  }

  return ibos;
}

/**
 * Returns one specific registered IBOS engine.
 *
 * Example:
 *
 * const language = useIBOSEngine("language");
 */
export function useIBOSEngine<
  K extends IBOSEngineName,
>(
  name: K,
): IBOSEngines[K] {
  const ibos = useIBOS();

  return ibos.getEngine(name);
}