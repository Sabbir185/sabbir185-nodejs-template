import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config({
    ignores: ["**/build/**", "**/dist/**", "src/random.ts"],
    files: ["**/*.ts"],
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
        eslintConfigPrettier,
    ],
    rules: {
        "no-unused-expressions": "error",
        "prefer-const": "error",
        "no-console": "warn",
        "dot-notation": "error",
        "@typescript-eslint/no-unused-vars": "warn",
    },
});
