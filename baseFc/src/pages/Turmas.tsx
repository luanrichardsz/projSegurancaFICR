import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Users, Calendar, Clock, MapPin, Plus, CheckCircle2, XCircle, 
  AlertCircle, ShieldCheck, ChevronRight, X, UserCheck, AlertTriangle
} from 'lucide-react';

interface Turma {
  id: string;
  name: string;
  category: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  capacity: number;
  location: string;
  teacher_id: string;
  status: string;
  teachers?: {
    id: string;
    name: string;
  };
  enrolledCount?: number;
}

export const Turmas = () => {
  const { token, role } = useAuth();
  const [classes, setClasses] = useState<Turma[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState<Turma | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState<Turma | null>(null);

  // New class form
  const [newClass, setNewClass] = useState({
    name: '',
    category: 'Sub-11',
    teacher_id: '',
    days_of_week: ['SEG', 'QUA'],
    start_time: '14:00',
    end_time: '15:30',
    capacity: 20,
    location: 'Campo Principal A'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Attendance form state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA'>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Class Enrollment state
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const loadClassesAndTeachers = async () => {
    try {
      setLoading(true);
      const [classesData, teachersData] = await Promise.all([
        fetchApi('/classes', {}, token),
        fetchApi('/teachers', {}, token)
      ]);
      setClasses(classesData || []);
      setTeachers(teachersData || []);
      if (teachersData && teachersData.length > 0 && !newClass.teacher_id) {
        setNewClass(prev => ({ ...prev, teacher_id: teachersData[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar turmas e professores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndTeachers();
  }, [token]);

  // Handle Attendance Open
  const handleOpenAttendance = async (turma: Turma) => {
    setShowAttendanceModal(turma);
    setAttendanceSuccess(false);
    try {
      setAttendanceLoading(true);
      const students = await fetchApi(`/classes/${turma.id}/students`, {}, token);
      setClassStudents(students || []);
      
      // Default all to PRESENTE
      const initialMap: Record<string, 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA'> = {};
      (students || []).forEach((s: any) => {
        initialMap[s.id] = 'PRESENTE';
      });
      setAttendanceRecords(initialMap);
    } catch (err) {
      console.error('Erro ao carregar alunos da turma', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!showAttendanceModal) return;
    try {
      setAttendanceLoading(true);
      const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
        student_id,
        status,
        notes: ''
      }));

      await fetchApi('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          class_id: showAttendanceModal.id,
          session_date: attendanceDate,
          records
        })
      }, token);

      setAttendanceSuccess(true);
      setTimeout(() => {
        setShowAttendanceModal(null);
        setAttendanceSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert(`Erro ao salvar lista de presença: ${err.message}`);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Handle Students / Enrollment Modal Open
  const handleOpenStudentsModal = async (turma: Turma) => {
    setShowStudentsModal(turma);
    setEnrollError('');
    try {
      setEnrollLoading(true);
      const [enrolled, allStudents] = await Promise.all([
        fetchApi(`/classes/${turma.id}/students`, {}, token),
        fetchApi('/students', {}, token)
      ]);
      setClassStudents(enrolled || []);
      
      // Filter out students already enrolled
      const enrolledIds = new Set((enrolled || []).map((e: any) => e.id));
      const notEnrolled = (allStudents || []).filter((s: any) => !enrolledIds.has(s.id) && s.status === 'ATIVO');
      setAvailableStudents(notEnrolled);
      if (notEnrolled.length > 0) {
        setSelectedStudentToEnroll(notEnrolled[0].id);
      }
    } catch (err) {
      console.error('Erro ao gerenciar alunos da turma', err);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!showStudentsModal || !selectedStudentToEnroll) return;
    try {
      setEnrollLoading(true);
      setEnrollError('');
      await fetchApi(`/classes/${showStudentsModal.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ student_id: selectedStudentToEnroll })
      }, token);

      // Refresh data
      await handleOpenStudentsModal(showStudentsModal);
      await loadClassesAndTeachers();
    } catch (err: any) {
      setEnrollError(err.message || 'Erro ao matricular aluno');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!showStudentsModal) return;
    if (!window.confirm('Deseja desvincular este atleta da turma?')) return;
    try {
      setEnrollLoading(true);
      await fetchApi(`/classes/${showStudentsModal.id}/enroll/${studentId}`, {
        method: 'DELETE'
      }, token);

      await handleOpenStudentsModal(showStudentsModal);
      await loadClassesAndTeachers();
    } catch (err: any) {
      alert(`Erro ao remover aluno: ${err.message}`);
    } finally {
      setEnrollLoading(false);
    }
  };

  // Create new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError('');
      await fetchApi('/classes', {
        method: 'POST',
        body: JSON.stringify({
          ...newClass,
          capacity: Number(newClass.capacity)
        })
      }, token);

      setShowCreateModal(false);
      setNewClass({
        name: '',
        category: 'Sub-11',
        teacher_id: teachers[0]?.id || '',
        days_of_week: ['SEG', 'QUA'],
        start_time: '14:00',
        end_time: '15:30',
        capacity: 20,
        location: 'Campo Principal A'
      });
      await loadClassesAndTeachers();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar turma');
    } finally {
      setCreateLoading(false);
    }
  };

  const daysOptions = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

  const toggleDay = (day: string) => {
    setNewClass(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Turmas e Treinos</h1>
          <p className="text-gray-500 mt-1">Gestão de horários, vagas e controle de frequência em campo</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Turma
          </button>
        )}
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="p-16 text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          Carregando turmas...
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-xs">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">Nenhuma turma cadastrada</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Crie turmas por categoria e horário para matricular atletas e controlar presença.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(turma => {
            const count = turma.enrolledCount || 0;
            const capacity = turma.capacity || 20;
            const percentage = Math.min(Math.round((count / capacity) * 100), 100);
            const isFull = count >= capacity;

            return (
              <div 
                key={turma.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {turma.category}
                    </span>
                    {isFull ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                        LOTADA
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">
                        {capacity - count} vagas livres
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{turma.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Professor: <span className="font-semibold text-gray-700">{turma.teachers?.name || 'Não atribuído'}</span>
                  </p>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-gray-600 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{turma.days_of_week ? turma.days_of_week.join(' • ') : 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{turma.start_time?.substring(0, 5)} às {turma.end_time?.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{turma.location || 'Campo de treino'}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-50">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">Capacidade</span>
                      <span className="font-bold text-gray-800">{count} / {capacity} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          isFull ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenStudentsModal(turma)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    Atletas ({count})
                  </button>

                  <button
                    onClick={() => handleOpenAttendance(turma)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-lg transition-colors shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Chamada
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Fazer Chamada (Attendance) */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lista de Chamada</h3>
                <p className="text-xs text-gray-500">{showAttendanceModal.name} • {showAttendanceModal.category}</p>
              </div>
              <button 
                onClick={() => setShowAttendanceModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-100 bg-emerald-50/40 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Data da Sessão / Treino:
              </label>
              <input 
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {attendanceLoading ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Carregando lista de chamada...
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-xs">
                  Nenhum atleta matriculado nesta turma para responder à chamada.
                </div>
              ) : (
                classStudents.map((aluno: any) => {
                  const status = attendanceRecords[aluno.id] || 'PRESENTE';
                  return (
                    <div 
                      key={aluno.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#112F20] text-white text-xs font-bold flex items-center justify-center">
                          {aluno.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{aluno.name}</p>
                          <p className="text-2xs text-gray-500">Camisa #{aluno.jersey_number || 'S/N'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'PRESENTE' }))}
                          className={`px-2.5 py-1 text-2xs font-bold rounded-lg border transition-all ${
                            status === 'PRESENTE'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'FALTA' }))}
                          className={`px-2.5 py-1 text-2xs font-bold rounded-lg border transition-all ${
                            status === 'FALTA'
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Falta
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'FALTA_JUSTIFICADA' }))}
                          className={`px-2.5 py-1 text-2xs font-bold rounded-lg border transition-all ${
                            status === 'FALTA_JUSTIFICADA'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Justificada
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between">
              {attendanceSuccess ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Chamada registrada com integridade!
                </div>
              ) : (
                <div className="text-2xs text-gray-500">
                  Registros assinados e auditados pelo usuário logado.
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={attendanceLoading || classStudents.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {attendanceLoading ? 'Salvando...' : 'Confirmar Chamada'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Gerenciar Alunos da Turma / Matricular (com validação de lotação no Backend) */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Atletas na Turma</h3>
                <p className="text-xs text-gray-500">
                  {showStudentsModal.name} • Vagas: {classStudents.length} / {showStudentsModal.capacity}
                </p>
              </div>
              <button 
                onClick={() => setShowStudentsModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inclusão com checagem de lotação */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Adicionar Atleta à Turma:
              </label>

              {enrollError && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{enrollError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <select
                  value={selectedStudentToEnroll}
                  onChange={e => setSelectedStudentToEnroll(e.target.value)}
                  disabled={availableStudents.length === 0 || classStudents.length >= showStudentsModal.capacity}
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                >
                  {availableStudents.length === 0 ? (
                    <option value="">Nenhum atleta disponível para inclusão</option>
                  ) : (
                    availableStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category || 'Geral'}) - CPF: {s.cpf}
                      </option>
                    ))
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleEnrollStudent}
                  disabled={enrollLoading || availableStudents.length === 0 || classStudents.length >= showStudentsModal.capacity}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all disabled:opacity-50"
                >
                  {classStudents.length >= showStudentsModal.capacity ? 'Turma Cheia' : 'Matricular'}
                </button>
              </div>
            </div>

            {/* Lista dos atletas atuais */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {enrollLoading ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Atualizando atletas...
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-xs">
                  Nenhum atleta matriculado nesta turma ainda.
                </div>
              ) : (
                classStudents.map((aluno: any) => (
                  <div 
                    key={aluno.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        {aluno.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{aluno.name}</p>
                        <p className="text-2xs text-gray-500">{aluno.position || 'Atleta'} • Camisa #{aluno.jersey_number || 'S/N'}</p>
                      </div>
                    </div>

                    {role === 'GESTOR' && (
                      <button
                        type="button"
                        onClick={() => handleUnenrollStudent(aluno.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentsModal(null)}
                className="px-5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Nova Turma */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cadastrar Nova Turma</h3>
                <p className="text-xs text-gray-500">Defina os horários, limite de atletas e professor responsável</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="flex-1 overflow-y-auto p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Turma *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Sub-13 Manhã - Iniciação"
                  value={newClass.name}
                  onChange={e => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoria *</label>
                  <select
                    value={newClass.category}
                    onChange={e => setNewClass(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Sub-7">Sub-7</option>
                    <option value="Sub-9">Sub-9</option>
                    <option value="Sub-11">Sub-11</option>
                    <option value="Sub-13">Sub-13</option>
                    <option value="Sub-15">Sub-15</option>
                    <option value="Sub-17">Sub-17</option>
                    <option value="Feminino Base">Feminino Base</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Professor Responsável *</label>
                  <select
                    value={newClass.teacher_id}
                    onChange={e => setNewClass(prev => ({ ...prev, teacher_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Dias de Treino *</label>
                <div className="flex flex-wrap gap-2">
                  {daysOptions.map(day => {
                    const isSelected = newClass.days_of_week.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Horário Início *</label>
                  <input 
                    type="time"
                    required
                    value={newClass.start_time}
                    onChange={e => setNewClass(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Horário Fim *</label>
                  <input 
                    type="time"
                    required
                    value={newClass.end_time}
                    onChange={e => setNewClass(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Capacidade Máxima (Vagas) *</label>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newClass.capacity}
                    onChange={e => setNewClass(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Campo / Local</label>
                  <input 
                    type="text"
                    value={newClass.location}
                    onChange={e => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {createLoading ? 'Salvando...' : 'Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
