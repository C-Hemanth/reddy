var lastSentence = ""

export function autoCompleteSave(text: string, obj: any) {
	if (text.length) {
		var addToStorage = false

		var count = 0
		var sentence = ""
		for (const k in obj) {
			if (k.startsWith(text)) {
				if (count === 0) {
					count = obj[k].uses
					sentence = k
				} else {
					if (obj[k].uses > count) {
						count = obj[k].uses
						sentence = k
					}
				}
			}
		}
		lastSentence = text
		if (sentence) {
			return {
				complete: sentence.slice(text.length, sentence.length),
				save: addToStorage
			}
		} else {
			return {
				complete: false,
				save: addToStorage
			}
		}
	} else {
		addToStorage = false
		if (obj[lastSentence] === undefined) {
			addToStorage = true
		}
		return {
			complete: false,
			save: addToStorage,
			line: lastSentence
		}
	}
}