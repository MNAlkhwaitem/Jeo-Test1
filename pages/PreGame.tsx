import React, { useState, useEffect } from 'react';
import { Player, Question, QuestionStatus } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';

interface PreGameProps {
  currentUser: Player;
  players: Player[];
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  categories: string[];
  boardSize: number;
  onStartMidGame: () => void;
}

const PreGame: React.FC<PreGameProps> = ({ currentUser, questions, setQuestions, categories, boardSize, onStartMidGame }) => {
  const isGM = currentUser.isGameMaster;

  // Form state
  const [category, setCategory] = useState(categories[0] || '');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // GM state
  const [reviewingQuestion, setReviewingQuestion] = useState<Question | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const validateForm = () => {
      if (!category || !questionText.trim() || !answerText.trim()) {
          setFormError('الرجاء ملء جميع الحقول.');
          setTimeout(() => setFormError(''), 3000);
          return false;
      }
      setFormError('');
      return true;
  }

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const status = isGM ? QuestionStatus.Approved : QuestionStatus.Pending;
    let points = 0;

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      category,
      question: questionText,
      answer: answerText,
      points,
      status,
    };
    setQuestions(prev => [...prev, newQuestion]);
    setQuestionText('');
    setAnswerText('');
    setSubmitSuccess('تم إرسال السؤال بنجاح!');
    setTimeout(() => setSubmitSuccess(''), 2000);
  };
  
  const handleReviewQuestion = (question: Question) => {
    setReviewingQuestion(question);
    setEditedQuestion(question);
    setIsModalOpen(true);
  };
  
  const handleSaveChanges = (status: QuestionStatus) => {
    if (!reviewingQuestion || !editedQuestion) return;

    const finalQuestion = { ...reviewingQuestion, ...editedQuestion, status };
    
    // If we're rejecting it, points are zero.
    if (status === QuestionStatus.Rejected) {
      finalQuestion.points = 0;
    }
    // If we are approving and no points are set, it's an error.
    else if (status === QuestionStatus.Approved && !finalQuestion.points) {
      alert('الرجاء تحديد قيمة النقاط للسؤال.');
      return;
    }

    setQuestions(prev => prev.map(q => q.id === finalQuestion.id ? finalQuestion : q));
    setIsModalOpen(false);
    setReviewingQuestion(null);
    setEditedQuestion({});
  };

  const myQuestions = questions.filter(q => q.creatorId === currentUser.id);
  const pendingQuestions = questions.filter(q => q.status === QuestionStatus.Pending);
  const approvedQuestionsCount = questions.filter(q => q.status === QuestionStatus.Approved).length;
  const requiredQuestions = boardSize * boardSize;
  const progressPercentage = requiredQuestions > 0 ? (approvedQuestionsCount / requiredQuestions) * 100 : 0;

  const StatusIndicator = ({ status }: { status: QuestionStatus }) => {
    const statusMap = {
        [QuestionStatus.Approved]: { text: 'مقبول', color: 'text-green-400', icon: '✓' },
        [QuestionStatus.Pending]: { text: 'قيد المراجعة', color: 'text-yellow-400', icon: '…' },
        [QuestionStatus.Rejected]: { text: 'مرفوض', color: 'text-red-400', icon: '✕' },
    };
    const { text, color, icon } = statusMap[status];
    return <p className={`text-sm font-bold ${color} flex items-center`}>{icon}<span className="mr-1">{text}</span></p>;
  };

  // Memoize available points calculation
  const availablePointsPerCategory = React.useMemo(() => {
    const pointsMap = new Map<string, number[]>();
    categories.forEach(cat => {
      const allPossiblePoints = Array.from({ length: boardSize }, (_, i) => (i + 1) * 100);
      const approvedQuestionsForCat = questions.filter(q => q.category === cat && q.status === QuestionStatus.Approved);
      const takenPoints = approvedQuestionsForCat.map(q => q.points);
      const availablePoints = allPossiblePoints.filter(p => !takenPoints.includes(p));
      pointsMap.set(cat, availablePoints);
    });
    return pointsMap;
  }, [questions, categories, boardSize]);


  const renderPlayerView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-indigo-300">إضافة سؤال جديد</h2>
        <form onSubmit={handleQuestionSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">الفئة</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400">السؤال</label>
            <Input type="text" value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="اكتب سؤالك هنا..."/>
          </div>
          <div>
            <label className="text-sm text-slate-400">الجواب</label>
            <Input type="text" value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="اكتب الجواب الصحيح هنا..."/>
          </div>
          {formError && <p className="text-red-400 text-sm text-center bg-red-900/50 p-2 rounded-md">{formError}</p>}
          {submitSuccess && <p className="text-green-400 text-sm text-center bg-green-900/50 p-2 rounded-md">{submitSuccess}</p>}
          <Button type="submit" className="w-full" size="lg">إرسال السؤال للمراجعة</Button>
        </form>
      </Card>
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-indigo-300">أسئلتي</h2>
        <div className="max-h-96 overflow-y-auto pr-2">
          {myQuestions.length > 0 ? (
            <ul className="space-y-3">
              {myQuestions.map(q => (
                <li key={q.id} className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-indigo-500">
                  <p className="font-semibold">{q.question}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-400">الفئة: {q.category}</p>
                    <StatusIndicator status={q.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 pt-16">لم تقم بتقديم أي أسئلة بعد.</p>
          )}
        </div>
      </Card>
    </div>
  );

  const renderGMView = () => (
    <div className="w-full">
        <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-indigo-300">تقدم ملء اللوحة</h2>
            <div className="flex justify-between items-center mb-2">
                <p>الأسئلة المقبولة: {approvedQuestionsCount} / {requiredQuestions}</p>
                <span className="font-bold text-lg">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <h2 className="text-2xl font-bold mb-4 text-indigo-300">مراجعة الأسئلة ({pendingQuestions.length})</h2>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {pendingQuestions.length > 0 ? pendingQuestions.map(q => (
                    <div key={q.id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold">{q.question}</p>
                        <p className="text-sm text-gray-400">المقدم: {q.creatorName} | الفئة: {q.category}</p>
                    </div>
                    <Button onClick={() => handleReviewQuestion(q)}>مراجعة</Button>
                    </div>
                )) : <p className="text-center text-gray-400 pt-16">لا توجد أسئلة قيد المراجعة.</p>}
                </div>
            </Card>

            <Card>
                 <h2 className="text-2xl font-bold mb-4 text-indigo-300">إضافة سؤال (GM)</h2>
                 <p className="text-sm text-slate-400 mb-4">الأسئلة المضافة هنا تتم الموافقة عليها تلقائياً. يجب تحديد النقاط.</p>
                <form onSubmit={e => {
                    e.preventDefault();
                    if (!validateForm()) return;
                    const points = parseInt(e.currentTarget.points.value);
                    if (!points) {
                        alert("الرجاء تحديد قيمة نقاط للسؤال.");
                        return;
                    }

                    const newQuestion: Question = {
                        id: crypto.randomUUID(),
                        creatorId: currentUser.id,
                        creatorName: currentUser.name,
                        category,
                        question: questionText,
                        answer: answerText,
                        points,
                        status: QuestionStatus.Approved,
                    };
                    setQuestions(prev => [...prev, newQuestion]);
                    setQuestionText('');
                    setAnswerText('');
                }} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">الفئة</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                   <div>
                        <label className="text-sm text-slate-400">النقاط</label>
                        <select name="points" required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">اختر النقاط</option>
                            {(availablePointsPerCategory.get(category) || []).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                  <div>
                    <label className="text-sm text-slate-400">السؤال</label>
                    <Input type="text" value={questionText} onChange={e => setQuestionText(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">الجواب</label>
                    <Input type="text" value={answerText} onChange={e => setAnswerText(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">إضافة وقبول السؤال</Button>
                </form>
            </Card>
        </div>

        <div className="mt-8 text-center">
            <Button onClick={onStartMidGame} disabled={approvedQuestionsCount < requiredQuestions} size="lg">
                {approvedQuestionsCount < requiredQuestions ? `تحتاج إلى ${requiredQuestions - approvedQuestionsCount} سؤال لبدء اللعبة` : 'بدء اللعبة الآن!'}
            </Button>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="مراجعة وتعديل السؤال">
            {reviewingQuestion && editedQuestion && (
            <div className="space-y-4 text-right">
                <div>
                    <label className="text-sm text-indigo-400">السؤال:</label>
                    <Input value={editedQuestion.question} onChange={e => setEditedQuestion(p => ({...p, question: e.target.value}))} />
                </div>
                <div>
                    <label className="text-sm text-indigo-400">الجواب:</label>
                    <Input value={editedQuestion.answer} onChange={e => setEditedQuestion(p => ({...p, answer: e.target.value}))} />
                </div>
                 <div>
                    <label className="text-sm text-indigo-400">الفئة:</label>
                    <select value={editedQuestion.category} onChange={e => setEditedQuestion(p => ({...p, category: e.target.value, points: 0}))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-indigo-400">النقاط:</label>
                    <select value={editedQuestion.points || ''} onChange={e => setEditedQuestion(p => ({...p, points: parseInt(e.target.value)}))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        <option value="">اختر النقاط</option>
                        {reviewingQuestion.points !==0 && <option value={reviewingQuestion.points}>{reviewingQuestion.points} (الحالي)</option>}
                        {(availablePointsPerCategory.get(editedQuestion.category!) || []).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                    <Button variant="danger" onClick={() => handleSaveChanges(QuestionStatus.Rejected)}>رفض</Button>
                    <Button variant="primary" onClick={() => handleSaveChanges(QuestionStatus.Approved)}>قبول وتعديل</Button>
                </div>
            </div>
            )}
        </Modal>
    </div>
  );
  
  return (
    <div className="flex flex-col items-center w-full">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-indigo-400">إعداد اللعبة</h1>
        <p className="text-slate-400 mt-2">{isGM ? 'قم بمراجعة أسئلة اللاعبين وأضف أسئلتك الخاصة لملء اللوحة.' : 'أضف أسئلتك للمساهمة في اللعبة!'}</p>
      </header>
      {isGM ? renderGMView() : renderPlayerView()}
    </div>
  );
};

export default PreGame;
