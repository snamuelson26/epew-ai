/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Enterprise Engine Base Class
 * ------------------------------------------------------------
 * Every Enterprise Core Engine inherits from this class.
 * ============================================================
 */

import { EnterpriseContext, EngineResult } from "./types";
import {
  beginEnterpriseTransaction,
  completeEnterpriseTransaction,
  failEnterpriseTransaction,
} from "./transaction";

export abstract class EnterpriseEngine<TInput = any, TOutput = any> {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Optional validation.
   */
  protected async validate(
    _context: EnterpriseContext,
    _input: TInput
  ): Promise<void> {}

  /**
   * Business logic implemented by child engines.
   */
  protected abstract execute(
    context: EnterpriseContext,
    input: TInput
  ): Promise<TOutput>;

  /**
   * Optional hook executed after success.
   */
  protected async afterExecute(
    _context: EnterpriseContext,
    _output: TOutput
  ): Promise<void> {}

  /**
   * Standard Enterprise execution pipeline.
   */
  async run(
    context: EnterpriseContext,
    input: TInput
  ): Promise<EngineResult<TOutput>> {
    const started = Date.now();

    const transaction = beginEnterpriseTransaction(
      context,
      this.name
    );

    try {
      await this.validate(context, input);

      const output = await this.execute(
        context,
        input
      );

      await this.afterExecute(
        context,
        output
      );

      const completed =
        completeEnterpriseTransaction(transaction);

      return {
        success: true,
        status: "success",
        message: `${this.name} completed successfully.`,
        data: output,
        transaction: completed,
        durationMs: Date.now() - started,
      };
    } catch (error: any) {
      const failed =
        failEnterpriseTransaction(transaction, {
          error: error?.message,
        });

      return {
        success: false,
        status: "failed",
        message:
          error?.message ??
          `${this.name} failed.`,
        transaction: failed,
        durationMs: Date.now() - started,
      };
    }
  }
}