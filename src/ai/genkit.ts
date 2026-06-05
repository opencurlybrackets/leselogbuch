/**
 * Minimaler Stub, damit der Build auch ohne Genkit/API-Key funktioniert.
 * Du kannst das später durch echtes Genkit ersetzen.
 */

type PromptDefinition<I, O> = {
  name: string;
  // Wir halten das extrem simpel: nur Typen, keine Runtime-Validierung.
  input: { schema: unknown };
  output: { schema: unknown };
  prompt: string;
};

export const ai = {
  definePrompt<I extends Record<string, unknown>, O extends Record<string, unknown>>(
    _def: PromptDefinition<I, O>
  ) {
    return async (_input: I): Promise<{ output?: O }> => {
      // Ohne echtes Genkit liefern wir bewusst "kein Output" zurück.
      return {};
    };
  }
};

