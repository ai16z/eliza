import { Character, DynamicPlugin, Plugin } from "./types";

export function getSecret(
    character: Character,
    secret: string
): string | undefined {
    return character.settings?.secrets?.[secret] ?? process.env[secret];
}

export async function loadPlugin(
    keys: string | string[],
    character: Character,
    importFn: () => Promise<Plugin>
): Promise<Plugin | null> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const hasAllSecrets =
        keyArray.every((key) => getSecret(character, key)) ||
        keyArray.length === 0;
    if (!hasAllSecrets) return null;
    return importFn();
}

const importCache = new Map<
    () => Promise<Plugin | Plugin[]>,
    Promise<Plugin | Plugin[]>
>();

export async function loadPlugins(
    character: Character,
    definitions: DynamicPlugin[]
): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    for (const def of definitions) {
        const keyArray = Array.isArray(def.secrets)
            ? def.secrets
            : [def.secrets];
        const hasAllSecrets =
            keyArray.every((key) => getSecret(character, key)) ||
            keyArray.length === 0;
        if (!hasAllSecrets) continue;

        let importPromise = importCache.get(def.importFn);
        if (!importPromise) {
            importPromise = def.importFn();
            importCache.set(def.importFn, importPromise);
        }
        const result = await importPromise;
        plugins.push(...(Array.isArray(result) ? result : [result]));
    }
    return plugins;
}
