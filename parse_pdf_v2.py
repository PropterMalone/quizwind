"""
PDF parser for KidWind Quizbowl questions.
Extracts multiple-choice questions from all grade levels using font detection.
"""

import json
import re
import pymupdf  # PyMuPDF


def detect_topic(question_text: str) -> str:
    """Detect topic from question text using keyword matching."""
    text_lower = question_text.lower()

    # Check most specific topics first
    if "wind" in text_lower:
        return "wind"
    if "solar" in text_lower:
        return "solar"
    if "turbine" in text_lower:
        return "turbine"
    if any(word in text_lower for word in ["electricity", "circuit", "watt", "volt", "amp", "ohm"]):
        return "electricity"
    if any(word in text_lower for word in ["renewable", "non-renewable", "nonrenewable"]):
        return "renewable"
    if any(word in text_lower for word in ["fossil fuel", "coal", "oil", "natural gas"]):
        return "fossil fuels"
    if any(word in text_lower for word in ["climate", "greenhouse", "pollutant", "co2"]):
        return "climate"
    if "energy" in text_lower:
        return "energy"

    return "general"


def is_skip_question(text: str) -> bool:
    """Detect questions that should be skipped (diagrams, free-response, etc.)."""
    text_lower = text.lower()
    skip_keywords = [
        "diagram", "graph", "chart", "map", "picture",
        "draw an arrow", "in one sentence", "in two sentences",
        "what do the acronyms", "what is betz"
    ]
    return any(keyword in text_lower for keyword in skip_keywords)


def extract_questions(pdf_path: str) -> list:
    """Extract all multiple-choice questions from the PDF."""
    doc = pymupdf.open(pdf_path)
    questions = []
    current_grade = None

    for page_num in range(len(doc)):
        page = doc[page_num]
        text_dict = page.get_text("dict")

        # Skip first page (cover)
        if page_num == 0:
            continue

        # Process all blocks and lines
        for block in text_dict.get("blocks", []):
            if "lines" not in block:
                continue

            for line in block["lines"]:
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    font = span.get("font", "")

                    # Detect grade level section headers
                    if "Questions Grades" in text and "Bold" in font:
                        if "4-5" in text:
                            current_grade = "4-5"
                        elif "6-8" in text:
                            current_grade = "6-8"
                        elif "9-12" in text:
                            current_grade = "9-12"

        # Now extract questions with structured parsing
        if current_grade:
            page_questions = extract_questions_from_page(page, current_grade)
            questions.extend(page_questions)

    doc.close()
    return questions


def extract_questions_from_page(page, grade_level: str) -> list:
    """Extract questions from a single page using span-level analysis."""
    text_dict = page.get_text("dict")
    questions = []

    # Collect all spans with their text and font info
    spans = []
    for block in text_dict.get("blocks", []):
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                font = span.get("font", "")
                if text:
                    spans.append({"text": text, "font": font, "is_bold": "Bold" in font})

    # Parse questions
    i = 0
    while i < len(spans):
        span = spans[i]

        # Detect question number - can be standalone "1." or start of text "1. Which..."
        match = re.match(r'^(\d+)\.', span["text"])
        if match:
            question_num = match.group(1)
            question_data = parse_question(spans, i, grade_level, question_num)
            if question_data:
                questions.append(question_data)

        i += 1

    return questions


def parse_question(spans: list, start_idx: int, grade_level: str, question_num: str) -> dict | None:
    """Parse a single question starting from the question number span."""
    # Collect question text
    i = start_idx
    question_parts = []

    # First span might be "1." or "1. Which of the following..."
    first_text = spans[i]["text"]
    # Remove the question number prefix
    question_first_part = re.sub(r'^\d+\.\s*', '', first_text).strip()
    if question_first_part:
        question_parts.append(question_first_part)

    i += 1

    # Continue collecting until we hit option "a."
    while i < len(spans):
        text = spans[i]["text"]
        # Stop when we hit the first option
        if re.match(r'^[a-e]\.', text):
            break
        question_parts.append(text)
        i += 1

    if not question_parts:
        return None

    question_text = " ".join(question_parts).strip()

    # Skip questions with diagrams or free-response
    if is_skip_question(question_text):
        return None

    # Parse options
    options = {}
    correct_answer = None

    while i < len(spans):
        text = spans[i]["text"]

        # Check if this is an option (starts with a., b., c., d., or e.)
        option_match = re.match(r'^([a-e])\.', text)
        if option_match:
            option_letter = option_match.group(1)

            # Get text from this span (after the letter)
            option_parts = []
            first_option_text = re.sub(r'^[a-e]\.\s*', '', text).strip()
            if first_option_text:
                option_parts.append(first_option_text)
                # Check if THIS span is bold (option letter + text together)
                if spans[i]["is_bold"]:
                    correct_answer = option_letter

            # Continue collecting option text until next option or question number
            i += 1

            while i < len(spans):
                next_text = spans[i]["text"]
                # Stop at next option or next question
                if re.match(r'^[a-e]\.', next_text) or re.match(r'^\d+\.', next_text):
                    break
                option_parts.append(next_text)

                # Check if this span is bold (correct answer)
                if spans[i]["is_bold"]:
                    correct_answer = option_letter

                i += 1

            option_text = " ".join(option_parts).strip()
            if option_text:
                options[option_letter] = option_text

            continue

        # Stop at next question
        if re.match(r'^\d+\.', text):
            break

        i += 1

    # Validate: must have exactly 4 options (a, b, c, d) and a correct answer
    if set(options.keys()) != {"a", "b", "c", "d"} or not correct_answer:
        return None

    # Build question object
    topic = detect_topic(question_text)
    question_id = f"g{grade_level.replace('-', '')}-{question_num}"

    return {
        "id": question_id,
        "gradeLevel": grade_level,
        "question": question_text,
        "options": options,
        "correctAnswer": correct_answer,
        "topic": topic
    }


def main():
    pdf_path = "C:/Users/karls/Downloads/Quizbowl-Bank.pdf"
    output_path = "C:/Users/karls/quizwind/src/data/questions.json"

    print("Extracting questions from PDF...")
    questions = extract_questions(pdf_path)

    # Statistics
    print(f"\n=== STATISTICS ===")
    print(f"Total questions extracted: {len(questions)}")

    # By grade
    by_grade = {}
    for q in questions:
        grade = q["gradeLevel"]
        by_grade[grade] = by_grade.get(grade, 0) + 1

    print(f"\nBy grade level:")
    for grade in sorted(by_grade.keys()):
        print(f"  {grade}: {by_grade[grade]} questions")

    # By topic
    by_topic = {}
    for q in questions:
        topic = q["topic"]
        by_topic[topic] = by_topic.get(topic, 0) + 1

    print(f"\nBy topic:")
    for topic in sorted(by_topic.keys()):
        print(f"  {topic}: {by_topic[topic]} questions")

    # Save to file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(questions)} questions to {output_path}")

    # Print first 3 questions
    print(f"\n=== FIRST 3 QUESTIONS ===")
    for q in questions[:3]:
        print(json.dumps(q, indent=2))
        print()


if __name__ == "__main__":
    main()
