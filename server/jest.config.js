/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    injectGlobals: true,
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        // Це дозволяє Jest розуміти імпорти з .js розширенням у TS файлах
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        // Налаштовуємо ts-jest для обробки ESM
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
};
