"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
} from "react";

import {
  createIBOS,
  type IBOS,
  type IBOSConfiguration,
} from "./IBOS";
import { IBOSContext } from "./IBOSContext";

export interface IBOSProviderProps {
  children: ReactNode;

  /**
   * An existing IBOS instance may be supplied when the application
   * requires a customized runtime.
   */
  instance?: IBOS;

  /**
   * Engine configuration used when the provider creates the runtime.
   */
  configuration?: IBOSConfiguration;

  /**
   * Automatically initialize registered engines when the provider mounts.
   */
  autoInitialize?: boolean;

  /**
   * Automatically shut down the runtime when the provider unmounts.
   *
   * Keep this false when the same IBOS instance is shared elsewhere.
   */
  shutdownOnUnmount?: boolean;

  /**
   * Optional initialization error callback.
   */
  onInitializationError?: (
    error: unknown,
  ) => void;
}

/**
 * Makes the IBOS runtime available to all descendant components.
 */
export function IBOSProvider({
  children,
  instance,
  configuration,
  autoInitialize = false,
  shutdownOnUnmount = false,
  onInitializationError,
}: IBOSProviderProps) {
  const ibos = useMemo(
    () => instance ?? createIBOS(configuration),
    [instance, configuration],
  );

  useEffect(() => {
    let mounted = true;

    if (autoInitialize) {
      void ibos.initialize().catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        if (onInitializationError) {
          onInitializationError(error);
          return;
        }

        console.error(
          "IBOS initialization failed:",
          error,
        );
      });
    }

    return () => {
      mounted = false;

      if (shutdownOnUnmount) {
        void ibos.shutdown().catch(
          (error: unknown) => {
            console.error(
              "IBOS shutdown failed:",
              error,
            );
          },
        );
      }
    };
  }, [
    autoInitialize,
    ibos,
    onInitializationError,
    shutdownOnUnmount,
  ]);

  return (
    <IBOSContext.Provider value={ibos}>
      {children}
    </IBOSContext.Provider>
  );
}

export default IBOSProvider;