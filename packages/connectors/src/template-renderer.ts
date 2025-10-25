import { Liquid } from 'liquidjs';

const engine = new Liquid();

export class TemplateRenderer {
  /**
   * Рендерит шаблон с переменными используя Liquid
   */
  static async render(template: string, variables: Record<string, any>): Promise<string> {
    try {
      return await engine.parseAndRender(template, variables);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Валидирует наличие всех обязательных переменных
   */
  static validateVariables(
    requiredVars: string[],
    providedVars: Record<string, any>,
  ): { valid: boolean; missing: string[] } {
    const missing = requiredVars.filter((varName) => !(varName in providedVars));
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

