import { defaultCharacter } from "../defaultCharacter";
import { ModelProviderName } from "../types";

describe("defaultCharacter", () => {
    it("should have the correct name", () => {
        expect(defaultCharacter.name).toBe("Eliza");
    });

    it("should have an empty plugins array", () => {
        expect(defaultCharacter.plugins).toEqual([]);
    });

    it("should have an empty clients array", () => {
        expect(defaultCharacter.clients).toEqual([]);
    });

    it.skip("should have the correct modelProvider", () => {
        expect(defaultCharacter.modelProvider).toBe(ModelProviderName.OLLAMA);
    });

    it("should have the correct voice model", () => {
        expect(defaultCharacter.settings.voice.model).toBe(
            "en_US-hfc_female-medium"
        );
    });

    it("should have a system description", () => {
        expect(defaultCharacter.system).toContain(
            "Roleplay and generate interesting"
        );
    });

    it("should have a bio array with at least one entry", () => {
        expect(defaultCharacter.bio.length).toBeGreaterThan(0);
    });

    it("should have a lore array with at least one entry", () => {
        expect(defaultCharacter.lore.length).toBeGreaterThan(0);
    });

    it("should have messageExamples array with at least one example", () => {
        expect(defaultCharacter.messageExamples.length).toBeGreaterThan(0);
    });

    it("should have a topics array with at least one broad topic", () => {
        expect(defaultCharacter.topics).toContain("Classical art");
    });

    it('should have style settings with "all" array', () => {
        expect(defaultCharacter.style.all.length).toBeGreaterThan(0);
    });
});
