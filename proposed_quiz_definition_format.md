You want to introduce a new concept of "pages" within a single quiz, where each page can have its own ID, title, and description, and questions will then be linked to these pages. This is a great enhancement for organizing longer quizzes!

This change will introduce a multi-page quiz experience, which is a significant update to both the quiz definition format and the frontend's rendering logic.

**Revised Quiz Definition Sheet Format with Pages:**

We will use the existing `page`, `element_id`, `type`, `value` columns, but the interpretation of the `page` column will now be more explicit for content elements.

**Columns:** `page`, `element_id`, `type`, `value`

*   **`page`**:
    *   For rows defining a `page_id`, `page_title`, or `page_description`: This column should be left empty. These rows define the page itself.
    *   For rows containing content elements (questions, sections, info text): This column will explicitly contain the `page_id` (from a `type: page_id` row) that this element belongs to.

*   **`element_id`**: (No change) Unique identifier for an element. If `question_id` is not explicitly provided, this will serve as the key for the backend payload.

*   **`type`**:
    *   **Quiz Global Metadata (remain at the top of the sheet):**
        *   `quiz_title`: The main title of the quiz. `value` = The quiz title text.
        *   `quiz_description`: A general description or introduction for the entire quiz. `value` = The description text.
        *   `response_sheet_id`: The ID of the Google Sheet where responses for *this specific quiz* will be saved. `value` = The Google Sheet ID.
    *   **Page Definition Elements (NEW):**
        *   `page_id`: **NEW**. Defines a unique identifier for a logical page within the quiz. `value` = The unique ID for this page (e.g., `intro_page`, `section_1`, `conclusion`).
        *   `page_title`: **NEW**. The title displayed at the top of this specific page. `value` = The page title text.
        *   `page_description`: **NEW**. A description or introduction for this specific page. `value` = The page description text.
    *   **Content Elements (Questions, sections, info text):**
        *   `question`: Marks the beginning of a new question block. `value` = The actual question text.
        *   `question_id`: The unique identifier that will be used as the key for this question's answer when sending data to the backend. If not provided for a question, `element_id` will be used as the `question_id`. `value` = The actual `questionId` string.
        *   `question_type`: Specifies the type of input field for the preceding `question`. `value` = `text`, `long_text`, `number`, `date`, `signature`, `choice`, `multi_choice`, `dropdown`, `hidden`.
        *   `question_option`: For `choice` and `multi_choice` question types, each option will be a separate row with this `type`. `value` = The text of the option.
        *   `question_hint`: Optional hint text for the question. `value` = The hint text.
        *   `question_placeholder`: Optional placeholder text for inputs that support it (text, long_text, number, phone, dropdown, etc.). `value` = The placeholder text.
        *   `question_remember_last`: Optional boolean flag to remember the last answer in local storage. `value` = `TRUE` or `FALSE`.
        *   `question_remember_key`: Optional key name to reuse a saved answer across quizzes (e.g., `first_name`, `phone`). Setting this enables remembering for the field.
        *   `question_default_answer`: Optional default value used when no remembered answer exists. `value` = The default answer text.
        *   `question_value`: Optional value for hidden inputs (sent with the response, not shown).
        *   `question_value_js`: Optional JavaScript expression or function body for hidden inputs. Must return a string.
        *   `question_error_message`: Optional custom error message for client-side validation. `value` = The error message.
        *   `question_right_answer`: The correct answer for the question. `value` = The correct answer.
        *   `question_validation_regex`: A regular expression string for client-side input validation. `value` = The regex string.
        *   `question_is_required`: A boolean flag indicating if the question is mandatory. `value` = `TRUE` or `FALSE`.
        *   `section_title`: Section title *within a page*.
        *   `info_text`: General informational text *within a page*.
        *   `display_html`: Raw HTML block *within a page*.

**Updated Example Quiz Definition Sheet (CSV format with Pages):**

```csv
page,element_id,type,value
,quiz_title,Science Basics Quiz
,quiz_description,Test your knowledge of fundamental science across multiple sections.
,response_sheet_id,YOUR_SCIENCE_BASICS_RESPONSE_SHEET_ID_HERE

,intro_page_def,page_id,intro
,intro_page_def,page_title,Introduction to Science
,intro_page_def,page_description,Welcome to the Science Basics Quiz. Please read the instructions carefully before proceeding.

intro,welcome_text,info_text,This first section covers general science knowledge.
intro,info_block,display_html,<div><strong>Note:</strong> Answers are anonymous.</div>
intro,Q1,question,What is the chemical symbol for water?
intro,Q1,question_id,water_symbol_q1
intro,Q1,question_type,text
intro,Q1,question_right_answer,H2O
intro,Q1,question_validation_regex,^[Hh]2[Oo]$
intro,Q1,question_is_required,TRUE

intro,Q2,question,Which planet is known as the Red Planet?
intro,Q2,question_id,red_planet_q2
intro,Q2,question_type,choice
intro,Q2,question_option,Earth
intro,Q2,question_option,Mars
intro,Q2,question_option,Jupiter
intro,Q2,question_right_answer,Mars
intro,Q2,question_is_required,TRUE
intro,Q2,question_hint,Think about its color.

,math_page_def,page_id,math
,math_page_def,page_title,Mathematics Section
,math_page_def,page_description,A few questions to test your basic math skills.

math,math_intro,info_text,This section requires numerical answers.
math,Q3,question,What is 15 multiplied by 3?
math,Q3,question_id,math_multiply_q3
math,Q3,question_type,number
math,Q3,question_right_answer,45
math,Q3,question_is_required,TRUE

math,Q4,question,Select all even numbers.
math,Q4,question_id,even_numbers_q4
math,Q4,question_type,multi_choice
math,Q4,question_option,2
math,Q4,question_option,3
math,Q4,question_option,4
math,Q4,question_option,5
math,Q4,question_right_answer,2;4
math,Q4,question_is_required,TRUE

,final_page_def,page_id,final_summary
,final_page_def,page_title,Summary and Confirmation
,final_page_def,page_description,Review your answers and sign to confirm your participation.

final_summary,F1,question,Enter today's date.
final_summary,F1,question_id,current_date_q5
final_summary,F1,question_type,date
final_summary,F1,question_is_required,FALSE

final_summary,F2,question,Sign here to confirm your participation.
final_summary,F2,question_id,signature_q6
final_summary,F2,question_type,signature
final_summary,F2,question_is_required,TRUE
```

**Impact on Frontend Implementation (Significant Changes):**

1.  **`fetchQuiz` Function:** Will continue to parse the raw CSV data into an array of `{page, element_id, type, value}` objects. It will still extract `quiz_title`, `quiz_description`, and `response_sheet_id` as global quiz metadata.
2.  **`renderQuiz` Function (Major Rewrite):**
    *   **Page Grouping**: Instead of rendering all elements sequentially, it will first process `quizData` to group elements by their `page` ID. It will create a data structure representing pages, each with its `page_title`, `page_description`, and a list of elements/questions belonging to that page.
    *   **Page Navigation UI**: Implement "Next" and "Previous" buttons (or similar navigation) to switch between pages.
    *   **Dynamic Page Rendering**: Only the elements for the currently active page will be rendered in the `#quiz-questions` div.
    *   **Question Rendering**: The logic for rendering individual questions and storing their data attributes (`data-question-id`, `data-question-type`, etc.) will largely remain the same *within the context of a page*.
3.  **`handleSubmitQuiz` Function:**
    *   **Validation Scope**: The validation logic will need to be adapted.
        *   Option A (Simpler): All questions from all pages are validated on the final "Submit" click. Navigation between pages does *not* trigger validation.
        *   Option B (More Complex/User-Friendly): Validation occurs when navigating to the next page, only for the questions on the *current* page. Submission is only allowed if all pages are valid.
    *   For initial implementation, I will stick to **Option A** (validate all questions on final submit) to manage complexity, but the UI will show one page at a time. The overall `quizAnswers` collection will still be for all questions across all pages.

This is a fundamental change to the quiz experience. I will update the `proposed_quiz_definition_format.md` file with these new page-related types and the updated example. Please review and confirm this refined structure before I proceed with the extensive frontend implementation changes.
