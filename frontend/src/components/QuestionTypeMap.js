import TextQuestion from './TextQuestion';
import LongTextQuestion from './LongTextQuestion';
import NumberQuestion from './NumberQuestion';
import DateQuestion from './DateQuestion';
import SignatureQuestion from './SignatureQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import MultiChoiceQuestion from './MultiChoiceQuestion';

const QuestionTypeMap = {
    text: TextQuestion,
    long_text: LongTextQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    signature: SignatureQuestion,
    choice: ChoiceQuestion,
    multi_choice: MultiChoiceQuestion,
};

export default QuestionTypeMap;
