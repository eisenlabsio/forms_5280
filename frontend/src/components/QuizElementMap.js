import TextFormInput from './TextFormInput';
import LongTextFormInput from './LongTextFormInput';
import NumberFormInput from './NumberFormInput';
import DateFormInput from './DateFormInput';
import SignatureFormInput from './SignatureFormInput';
import ChoiceFormInput from './ChoiceFormInput';
import DropdownFormInput from './DropdownFormInput';
import MultiChoiceFormInput from './MultiChoiceFormInput';
import TimeFormInput from './TimeFormInput';
import DateTimeFormInput from './DateTimeFormInput';
import PhoneFormInput from './PhoneFormInput';
import InfoTextFormInput from './InfoTextFormInput';
import DisplayHtmlFormInput from './DisplayHtmlFormInput';

const QuizElementMap = {
    info_text: InfoTextFormInput,
    display_html: DisplayHtmlFormInput,
    text: TextFormInput,
    long_text: LongTextFormInput,
    number: NumberFormInput,
    date: DateFormInput,
    signature: SignatureFormInput,
    choice: ChoiceFormInput,
    dropdown: DropdownFormInput,
    multi_choice: MultiChoiceFormInput,
    time: TimeFormInput,
    datetime: DateTimeFormInput,
    phone: PhoneFormInput,
};

export default QuizElementMap;
