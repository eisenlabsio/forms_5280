import TextQuestion from './TextQuestion';
import LongTextQuestion from './LongTextQuestion';
import NumberQuestion from './NumberQuestion';
import DateQuestion from './DateQuestion';
import SignatureQuestion from './SignatureQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import MultiChoiceQuestion from './MultiChoiceQuestion';
import TimeQuestion from './TimeQuestion';
import DateTimeQuestion from './DateTimeQuestion';
import PhoneQuestion from './PhoneQuestion';

const QuestionTypeMap = {
    text: TextQuestion,
    long_text: LongTextQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    signature: SignatureQuestion,
    choice: ChoiceQuestion,
    multi_choice: MultiChoiceQuestion,
    time: TimeQuestion,
    datetime: DateTimeQuestion,
    phone: PhoneQuestion,
};

export default QuestionTypeMap;
