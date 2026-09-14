/**
 * Repair-Bench adaptation: offline replacement for api.dictionaryapi.dev.
 * The upstream Definition widget fetched https://api.dictionaryapi.dev at
 * runtime; the repair environment runs with zero network access, so
 * definitions are produced locally and deterministically instead. The shape
 * matches the DictionaryEntry type consumed by Definition.svelte.
 */
export async function fetchLocalDefinition(word: string): Promise<DictionaryEntry> {
	return {
		word,
		phonetic: "",
		phonetics: [],
		origin: "",
		meanings: [
			{
				partOfSpeech: "noun",
				definitions: [
					{
						definition: `Offline placeholder definition for "${word}".`,
						synonyms: [],
						antonyms: [],
					},
				],
			},
		],
	};
}
