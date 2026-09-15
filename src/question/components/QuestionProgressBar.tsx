// 남은 질문 개수는 서버만 알고 응답에 담기지 않으므로, 완료율 대신 진행 중임만 보인다.
export default function QuestionProgressBar() {
    return (
        <div className="bar bar-unknown-end" role="progressbar" aria-label="질문 진행 중">
            <i></i>
        </div>
    );
}
