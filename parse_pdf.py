#!/usr/bin/env python3
"""
Extract questions from KidWind Quizbowl Bank PDF and convert to JSON format.

Requirements:
    pip install pypdf2

Usage:
    python parse_pdf.py path/to/Quizbowl-Bank.pdf
"""

import json
import re
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("Error: PyPDF2 not installed. Run: pip install pypdf2")
    sys.exit(1)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from PDF file."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def parse_questions(text: str) -> list:
    """Parse questions from extracted PDF text."""
    questions = []

    # Pattern to match question blocks
    # Questions start with a number and end with the correct answer in parentheses
    question_pattern = r'(\d+)\.\s+(.*?)(?=\n\d+\.|$)'

    # Find all question blocks
    blocks = re.findall(question_pattern, text, re.DOTALL)

    for question_num, block in blocks:
        # Extract question text (everything before options)
        lines = block.strip().split('\n')

        # Find where options start (first line starting with a), b), c), or d))
        option_start_idx = None
        for i, line in enumerate(lines):
            if re.match(r'^[a-d]\)', line.strip()):
                option_start_idx = i
                break

        if option_start_idx is None:
            continue

        question_text = ' '.join(lines[:option_start_idx]).strip()
        option_lines = lines[option_start_idx:]

        # Parse options
        options = {'a': '', 'b': '', 'c': '', 'd': ''}
        current_option = None

        for line in option_lines:
            line = line.strip()
            # Check if line starts with an option letter
            option_match = re.match(r'^([a-d])\)\s*(.*)', line)
            if option_match:
                current_option = option_match.group(1)
                options[current_option] = option_match.group(2)
            elif current_option and line and not line.startswith('('):
                # Continue previous option text
                options[current_option] += ' ' + line

        # Find correct answer (usually in parentheses at the end)
        correct_answer = None
        answer_match = re.search(r'\(([a-d])\)', block)
        if answer_match:
            correct_answer = answer_match.group(1)

        # Determine grade level (look for "Grades" in nearby text)
        grade_level = '6-8'  # Default
        if re.search(r'grade\s*4-5', block, re.IGNORECASE):
            grade_level = '4-5'
        elif re.search(r'grade\s*6-8', block, re.IGNORECASE):
            grade_level = '6-8'

        # Extract topic if mentioned
        topic = None
        topic_keywords = ['wind', 'solar', 'energy', 'turbine', 'renewable', 'electricity', 'power']
        question_lower = question_text.lower()
        for keyword in topic_keywords:
            if keyword in question_lower:
                topic = keyword
                break

        # Only add if we have all required fields
        if question_text and all(options.values()) and correct_answer:
            questions.append({
                'id': f'q{len(questions) + 1}',
                'gradeLevel': grade_level,
                'question': question_text,
                'options': {k: v.strip() for k, v in options.items()},
                'correctAnswer': correct_answer,
                'topic': topic
            })

    return questions


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path-to-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not Path(pdf_path).exists():
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    print(f"Extracting text from {pdf_path}...")
    text = extract_text_from_pdf(pdf_path)

    print("Parsing questions...")
    questions = parse_questions(text)

    print(f"Found {len(questions)} questions")

    # Save to JSON
    output_path = Path(__file__).parent / 'src' / 'data' / 'questions.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"Saved questions to {output_path}")

    # Print statistics
    grade_4_5 = sum(1 for q in questions if q['gradeLevel'] == '4-5')
    grade_6_8 = sum(1 for q in questions if q['gradeLevel'] == '6-8')

    print(f"\nStatistics:")
    print(f"  Total: {len(questions)}")
    print(f"  Grades 4-5: {grade_4_5}")
    print(f"  Grades 6-8: {grade_6_8}")

    topics = {}
    for q in questions:
        topic = q.get('topic', 'general')
        topics[topic] = topics.get(topic, 0) + 1

    print(f"\nTopics:")
    for topic, count in sorted(topics.items(), key=lambda x: x[1], reverse=True):
        print(f"  {topic}: {count}")


if __name__ == '__main__':
    main()
