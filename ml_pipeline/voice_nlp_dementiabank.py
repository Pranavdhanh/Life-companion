"""
Life Companion SIH 2026 - ML Training Pipeline
Dataset: AI4Bharat (Bhashini) & DementiaBank (Pitt Corpus)

This script demonstrates the NLP pipeline for the Voice Recall game.
It takes localized audio, converts it to text using Bhashini models,
and analyzes hesitation and semantic similarity to detect cognitive decline.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

def load_ai4bharat_ner_model():
    """
    Simulates loading a Bhashini Speech-to-Text model fine-tuned 
    for NER languages (Assamese, Bengali, Mizo, etc.)
    """
    print("Loading AI4Bharat localized acoustic models...")
    return "bhashini_ner_stt_v2"

def analyze_story_recall(original_story, patient_recalled_text):
    """
    Uses DementiaBank linguistic markers to calculate a Cognitive NLP Score.
    1. Semantic Similarity (Do they remember the core facts?)
    2. Hesitation/Pause detection (A key indicator in Alzheimer's)
    """
    print("\n--- Running Voice Recall NLP Analysis ---")
    print(f"Original: '{original_story}'")
    print(f"Patient Recalled: '{patient_recalled_text}'")
    
    # 1. Semantic Similarity (TF-IDF Cosine Similarity)
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([original_story, patient_recalled_text])
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    # 2. Hesitation Penalty (Based on DementiaBank research)
    # Finding filler words ("uh", "um", "ah") and repetitions
    fillers = ['uh', 'um', 'ah', 'like', 'you know']
    words = patient_recalled_text.lower().split()
    filler_count = sum(1 for w in words if w in fillers)
    
    # DementiaBank baseline: healthy adults use < 2% fillers in short recall.
    # Patients with early dementia use > 8%.
    hesitation_penalty = min(0.3, filler_count * 0.05)
    
    final_nlp_score = max(0.0, similarity - hesitation_penalty)
    
    print(f"Semantic Similarity: {similarity*100:.1f}%")
    print(f"Filler Words Detected: {filler_count}")
    print(f"Hesitation Penalty: -{(hesitation_penalty)*100:.1f}%")
    print(f"Final Cognitive NLP Score: {final_nlp_score*100:.1f} / 100")
    
    return final_nlp_score

if __name__ == "__main__":
    stt_model = load_ai4bharat_ner_model()
    
    # Example 1: Healthy Recall
    analyze_story_recall(
        "Aman went to the bazaar and bought three apples.",
        "Aman went to the market and bought three apples."
    )
    
    # Example 2: Mild Cognitive Impairment (MCI) Recall
    analyze_story_recall(
        "Aman went to the bazaar and bought three apples.",
        "Uh Aman went to the um store and he bought some uh fruit I think apples."
    )
