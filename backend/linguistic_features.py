import re
import nltk
import pronouncing
from nltk.corpus import words as nltk_words
import language_tool_python


_tool = language_tool_python.LanguageTool('en-US')
_english_words = set(w.lower() for w in nltk_words.words())
_cmu_dict = nltk.corpus.cmudict.dict()


def _compute_spelling_accuracy(word_list: list) -> float:
    """
    % of words that are correctly spelled english words.
    Adjusted for TrOCR output — removes punctuation before checking.
    """
    if not word_list:
        return 0.0

    # Clean words — remove punctuation before checking
    cleaned = [re.sub(r'[^a-zA-Z]', '', w) for w in word_list]
    cleaned = [w for w in cleaned if len(w) > 0]

    if not cleaned:
        return 0.0

    correct = sum(1 for w in cleaned if w.lower() in _english_words)
    return round((correct / len(cleaned)) * 100, 4)


def _compute_grammatical_accuracy(raw_text: str) -> float:
    """
    % of grammatically correct constructs.
    Uses LanguageTool to detect grammar errors.
    """
    if not raw_text.strip():
        return 0.0

    matches = _tool.check(raw_text)

    grammar_errors = [
        m for m in matches
        if 'SPELL' not in str(m.rule_issue_type).upper()
        and 'TYPO' not in str(m.rule_issue_type).upper()
    ]

    word_count = len(raw_text.split())
    if word_count == 0:
        return 0.0

    error_rate = len(grammar_errors) / word_count
    accuracy = max(0.0, (1 - error_rate)) * 100
    return round(accuracy, 4)


def _compute_percentage_of_corrections(raw_text: str) -> float:
    """
    % of words that appear to be corrections/cross-outs.
    Detects patterns like:
      - Repeated words (the the)
      - Words with strike-through artifacts from OCR
      - Words surrounded by correction markers
    """
    if not raw_text.strip():
        return 0.0

    word_list = raw_text.split()
    correction_count = 0

    for i, word in enumerate(word_list):
        # Repeated word — sign of correction
        if i > 0 and word.lower() == word_list[i - 1].lower():
            correction_count += 1
            continue

        # OCR artifacts from crossed-out words (contain non-alpha chars mid-word)
        if re.search(r'[a-zA-Z]{2,}[^a-zA-Z\s]+[a-zA-Z]{2,}', word):
            correction_count += 1
            continue

        # Very short fragments (1-2 chars) likely leftover from corrections
        if len(word) <= 2 and not word.lower() in {'a', 'i', 'an', 'in', 'is', 'it',
                                                    'of', 'or', 'to', 'do', 'so'}:
            correction_count += 1

    return round((correction_count / len(word_list)) * 100, 4)


def _compute_phonetic_accuracy(word_list: list) -> float:
    """
    % of words that are phonetically accurate.
    Cross-checks each word against the CMU pronouncing dictionary.
    Words found in CMU dict are considered phonetically standard.
    """
    if not word_list:
        return 0.0

    # Clean words before checking CMU dict
    cleaned = [re.sub(r'[^a-zA-Z]', '', w) for w in word_list]
    cleaned = [w for w in cleaned if len(w) > 0]

    if not cleaned:
        return 0.0

    phonetic_count = sum(
        1 for w in cleaned
        if w.lower() in _cmu_dict
    )
    return round((phonetic_count / len(cleaned)) * 100, 4)


def extract_linguistic_features(ocr_result: dict) -> dict:
    """
    Compute all 4 linguistic features from OCR output.

    Parameters
    ----------
    ocr_result : dict — output from ocr_module.extract_text()

    Returns
    -------
    dict:
        spelling_accuracy               : float (0-100)
        gramatical_accuracy             : float (0-100)
        percentage_of_corrections       : float (0-100)
        percentage_of_phonetic_accuraccy: float (0-100)
        feature_summary                 : human readable summary
    """
    raw_text  = ocr_result['raw_text']
    word_list = ocr_result['word_list']

    print("[Features] Computing linguistic features...")

    spelling   = _compute_spelling_accuracy(word_list)
    grammar    = _compute_grammatical_accuracy(raw_text)
    correction = _compute_percentage_of_corrections(raw_text)
    phonetic   = _compute_phonetic_accuracy(word_list)

    print(f"[Features] Spelling accuracy        : {spelling}%")
    print(f"[Features] Grammatical accuracy     : {grammar}%")
    print(f"[Features] Percentage of corrections: {correction}%")
    print(f"[Features] Phonetic accuracy        : {phonetic}%")

    return {
        'spelling_accuracy':                spelling,
        'gramatical_accuracy':              grammar,
        'percentage_of_corrections':        correction,
        'percentage_of_phonetic_accuraccy': phonetic,
        'feature_summary': {
            'Spelling Accuracy':    f"{spelling}%",
            'Grammatical Accuracy': f"{grammar}%",
            'Pct of Corrections':   f"{correction}%",
            'Phonetic Accuracy':    f"{phonetic}%",
        }
    }


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    sample_ocr = {
        'raw_text': 'the cat satt on the the mat he wnet to schoool',
        'word_list': ['the', 'cat', 'satt', 'on', 'the', 'the',
                      'mat', 'he', 'wnet', 'to', 'schoool']
    }
    features = extract_linguistic_features(sample_ocr)
    print("\nFeatures output:")
    for k, v in features.items():
        print(f"  {k}: {v}")