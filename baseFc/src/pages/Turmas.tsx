import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Users, Calendar, Clock, MapPin, Plus, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, X, UserCheck, AlertTriangle,
  GraduationCap, Phone, Heart, Activity, UserMinus, Search,
  ExternalLink, Sparkles, UserPlus, Shield, Check, Info, Edit3,
  Trash2
} from 'lucide-react';
import { maskPhone, maskCPF } from '../utils/masks.ts';
import { StudentProfileModal } from '../components/StudentProfileModal.tsx';
import { EditStudentModal } from '../components/EditStudentModal.tsx';

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
    email?: string;
    phone?: string;
    cref?: string;
  };
  enrolledCount?: number;
}

export const Turmas = () => {
  const { token, role } = useAuth();
  const [classes, setClasses] = useState<Turma[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Deep Class Detail Modal State
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTeacherId, setDetailTeacherId] = useState('');
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState('');
  const [teacherErrorMsg, setTeacherErrorMsg] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [viewingProfileStudentId, setViewingProfileStudentId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Other Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState<Turma | null>(null);

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
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Class Enrollment state inside modal
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

  // Open Deep Class Detail Modal
  const handleOpenClassDetail = async (turma: Turma | { id: string }) => {
    try {
      setDetailLoading(true);
      setEnrollError('');
      setTeacherSuccessMsg('');
      setTeacherErrorMsg('');
      setStudentSearchTerm('');

      const [fullClass, allStudents] = await Promise.all([
        fetchApi(`/classes/${turma.id}`, {}, token),
        fetchApi('/students', {}, token)
      ]);

      setSelectedClassDetail(fullClass);
      setDetailTeacherId(fullClass.teacher_id || fullClass.teacherId || '');

      // Filtrar alunos ativos que não estão matriculados nesta turma
      const enrolledIds = new Set((fullClass.students || []).map((s: any) => s.id));
      const notEnrolled = (allStudents || []).filter((s: any) => !enrolledIds.has(s.id) && s.status === 'ATIVO');
      setAvailableStudents(notEnrolled);
      if (notEnrolled.length > 0) {
        setSelectedStudentToEnroll(notEnrolled[0].id);
      } else {
        setSelectedStudentToEnroll('');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes aprofundados da turma:', err);
      alert('Erro ao carregar detalhes da turma.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Save/Change Teacher in Deep Class View
  const handleSaveTeacher = async () => {
    if (!selectedClassDetail) return;
    try {
      setSavingTeacher(true);
      setTeacherSuccessMsg('');
      setTeacherErrorMsg('');

      await fetchApi(`/classes/${selectedClassDetail.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          teacherId: detailTeacherId || null
        })
      }, token);

      setTeacherSuccessMsg('Professor atualizado com sucesso!');

      // Atualiza os dados locais
      const updatedClass = await fetchApi(`/classes/${selectedClassDetail.id}`, {}, token);
      setSelectedClassDetail(updatedClass);
      await loadClassesAndTeachers();

      setTimeout(() => {
        setTeacherSuccessMsg('');
      }, 3500);
    } catch (err: any) {
      setTeacherErrorMsg(err.message || 'Erro ao definir professor.');
    } finally {
      setSavingTeacher(false);
    }
  };

  // Helper para verificar conflito de horário do atleta com a turma aberta
  const getStudentScheduleConflict = (student: any) => {
    if (!selectedClassDetail || !selectedClassDetail.days_of_week || !selectedClassDetail.start_time || !selectedClassDetail.end_time) {
      return null;
    }
    const targetStart = (selectedClassDetail.start_time || '').slice(0, 5);
    const targetEnd = (selectedClassDetail.end_time || '').slice(0, 5);
    const targetDays: string[] = selectedClassDetail.days_of_week || [];

    for (const cl of (student.classes || [])) {
      if (!cl || cl.id === selectedClassDetail.id || cl.status === 'INATIVO') continue;
      const clDays: string[] = cl.days_of_week || cl.daysOfWeek || [];
      const commonDays = targetDays.filter(d => clDays.includes(d));
      if (commonDays.length > 0) {
        const clStart = (cl.start_time || cl.startTime || '').slice(0, 5);
        const clEnd = (cl.end_time || cl.endTime || '').slice(0, 5);
        if (targetStart < clEnd && clStart < targetEnd) {
          return {
            className: cl.name,
            commonDays,
            time: `${clStart} às ${clEnd}`
          };
        }
      }
    }
    return null;
  };

  // Enroll student from Deep Class View
  const handleEnrollInDetail = async () => {
    if (!selectedClassDetail || !selectedStudentToEnroll) return;

    // Pré-validação de conflito de agenda no client
    const studentObj = availableStudents.find(s => s.id === selectedStudentToEnroll);
    const conflict = studentObj ? getStudentScheduleConflict(studentObj) : null;
    if (conflict) {
      setEnrollError(
        `Conflito de horário: O atleta "${studentObj?.name}" já possui aula na turma "${conflict.className}" ` +
        `nos dias [${conflict.commonDays.join(', ')}] das ${conflict.time}. Não é permitido matricular no mesmo horário.`
      );
      return;
    }

    try {
      setEnrollLoading(true);
      setEnrollError('');

      await fetchApi(`/classes/${selectedClassDetail.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ student_id: selectedStudentToEnroll })
      }, token);

      await handleOpenClassDetail(selectedClassDetail);
      await loadClassesAndTeachers();
    } catch (err: any) {
      setEnrollError(err.message || 'Erro ao matricular atleta');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Unenroll student from Deep Class View
  const handleUnenrollInDetail = async (studentId: string, studentName: string) => {
    if (!selectedClassDetail) return;
    if (!window.confirm(`Deseja realmente desvincular o atleta "${studentName}" desta turma?`)) return;

    try {
      setDetailLoading(true);
      await fetchApi(`/classes/${selectedClassDetail.id}/students/${studentId}`, {
        method: 'DELETE'
      }, token);

      await handleOpenClassDetail(selectedClassDetail);
      await loadClassesAndTeachers();
    } catch (err: any) {
      alert(`Erro ao desvincular atleta: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  // Excluir Turma (apenas se não houver nenhum aluno matriculado)
  const handleDeleteClass = async (turma: { id: string; name: string; enrolledCount?: number; students?: any[] }) => {
    const studentCount = turma.enrolledCount !== undefined 
      ? turma.enrolledCount 
      : Array.isArray(turma.students) 
      ? turma.students.length 
      : 0;

    if (studentCount > 0) {
      alert(
        `⚠️ Bloqueio de Segurança:\n\n` +
        `Não é possível excluir a turma "${turma.name}" porque ela possui ${studentCount} aluno(s) matriculado(s).\n\n` +
        `Para garantir a integridade dos dados e a segurança dos atletas, remova ou transfira todos os alunos antes de excluir a turma.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir permanentemente a turma "${turma.name}"?\n\n` +
      `Esta ação removerá a turma do sistema e não poderá ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(turma.id);
      await fetchApi(`/classes/${turma.id}`, { method: 'DELETE' }, token);
      if (selectedClassDetail?.id === turma.id) {
        setSelectedClassDetail(null);
      }
      await loadClassesAndTeachers();
      alert(`Turma "${turma.name}" excluída com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao excluir turma: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Fetch Class Attendance for specific date
  const fetchClassAttendance = async (turmaId: string, dateStr: string) => {
    try {
      setAttendanceLoading(true);
      const data = await fetchApi(`/attendance/class/${turmaId}?date=${dateStr}`, {}, token);
      const studentsList = data?.students || [];
      setClassStudents(studentsList);

      const recordsMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'> = {};
      studentsList.forEach((s: any) => {
        recordsMap[s.id] = (s.status as 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO') || 'PRESENTE';
      });
      setAttendanceRecords(recordsMap);
    } catch (err: any) {
      console.error('Erro ao carregar chamada:', err);
      try {
        const fallbackStudents = await fetchApi(`/classes/${turmaId}/students`, {}, token);
        setClassStudents(fallbackStudents || []);
        const initialMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'> = {};
        (fallbackStudents || []).forEach((s: any) => {
          initialMap[s.id] = 'PRESENTE';
        });
        setAttendanceRecords(initialMap);
      } catch (fallbackErr) {
        console.error('Erro no fallback de alunos:', fallbackErr);
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Handle Attendance Open
  const handleOpenAttendance = async (turma: Turma) => {
    setShowAttendanceModal(turma);
    setAttendanceSuccess(false);
    await fetchClassAttendance(turma.id, attendanceDate);
  };

  // Handle Date Change inside Modal
  const handleAttendanceDateChange = async (newDate: string) => {
    setAttendanceDate(newDate);
    if (showAttendanceModal) {
      await fetchClassAttendance(showAttendanceModal.id, newDate);
    }
  };

  // Quick action: Mark all as present
  const handleMarkAllPresent = () => {
    const newMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'> = {};
    classStudents.forEach(s => {
      newMap[s.id] = 'PRESENTE';
    });
    setAttendanceRecords(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!showAttendanceModal) return;
    try {
      setAttendanceLoading(true);
      const attendees = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        student_id: studentId,
        status
      }));

      await fetchApi('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classId: showAttendanceModal.id,
          class_id: showAttendanceModal.id,
          date: attendanceDate,
          session_date: attendanceDate,
          attendees,
          records: attendees
        })
      }, token);

      setAttendanceSuccess(true);
      setTimeout(() => {
        setShowAttendanceModal(null);
        setAttendanceSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert(`Erro ao salvar lista de presença: ${err.message || 'Dados inválidos'}`);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Create new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.days_of_week || newClass.days_of_week.length === 0) {
      setCreateError('Selecione ao menos um dia da semana para o treino.');
      return;
    }

    if (newClass.name.trim().length < 3) {
      setCreateError('O nome da turma deve conter no mínimo 3 caracteres.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError('');
      await fetchApi('/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: newClass.name.trim(),
          category: newClass.category,
          teacherId: newClass.teacher_id || null,
          teacher_id: newClass.teacher_id || null,
          daysOfWeek: newClass.days_of_week,
          days_of_week: newClass.days_of_week,
          startTime: newClass.start_time,
          start_time: newClass.start_time,
          endTime: newClass.end_time,
          end_time: newClass.end_time,
          location: newClass.location.trim() || 'Campo Principal',
          capacity: Number(newClass.capacity) || 20,
          status: 'ATIVO'
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

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Filtragem de alunos na visualização detalhada da turma
  const enrolledStudents = selectedClassDetail?.students || [];
  const filteredStudents = enrolledStudents.filter((s: any) => {
    if (!studentSearchTerm.trim()) return true;
    const term = studentSearchTerm.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(term);
    const shirtMatch = String(s.shirt_number || s.shirtNumber || '').includes(term);
    const positionMatch = s.position?.toLowerCase().includes(term);
    const guardianMatch = s.primaryGuardian?.name?.toLowerCase().includes(term);
    return nameMatch || shirtMatch || positionMatch || guardianMatch;
  });

  const attendanceCounts = useMemo(() => {
    let pres = 0, aus = 0, just = 0;
    Object.values(attendanceRecords).forEach(st => {
      if (st === 'PRESENTE') pres++;
      else if (st === 'AUSENTE') aus++;
      else if (st === 'JUSTIFICADO') just++;
    });
    return { pres, aus, just, total: classStudents.length };
  }, [attendanceRecords, classStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Turmas e Treinos</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Clique na turma para visualizar todos os atletas, ficha resumida e atribuir professor</p>
        </div>
        
        {role === 'GESTOR' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#112F20] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E4D36] transition-all shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer w-full sm:w-auto"
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
            const teacherAssigned = turma.teachers?.name && turma.teachers.name !== 'Sem Professor';

            return (
              <div 
                key={turma.id} 
                onClick={() => handleOpenClassDetail(turma)}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group relative"
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

                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                    <span>{turma.name}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </h3>

                  {/* Teacher Info */}
                  <div className="mb-4">
                    {teacherAssigned ? (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Prof: <strong className="text-gray-800 font-semibold">{turma.teachers?.name}</strong></span>
                      </p>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-2xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        Sem professor atribuído
                      </span>
                    )}
                  </div>

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
                  <span className="text-xs font-medium text-emerald-700 group-hover:underline flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Ver Atletas ({count})
                  </span>

                  <div className="flex items-center gap-2">
                    {role === 'GESTOR' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(turma);
                        }}
                        disabled={deleteLoading === turma.id}
                        className={`inline-flex items-center justify-center p-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          count > 0 
                            ? 'text-gray-400 bg-gray-100 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                            : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                        }`}
                        title={count > 0 ? `Bloqueio: Turma possui ${count} aluno(s) matriculado(s)` : 'Excluir turma'}
                      >
                        {deleteLoading === turma.id ? (
                          <span className="animate-spin text-xs">...</span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAttendance(turma);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Chamada
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CARD APROFUNDADO DA TURMA & FICHA 100% RESUMIDA DOS ALUNOS */}
      {/* ========================================================================= */}
      {selectedClassDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Header da Turma com Visual de Alta Performance */}
            <div className="bg-[#112F20] text-white p-6 sm:p-7 relative shrink-0">
              <button 
                onClick={() => setSelectedClassDetail(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
                title="Fechar detalhes"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {selectedClassDetail.category}
                    </span>
                    <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-gray-200">
                      {selectedClassDetail.status || 'ATIVO'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {selectedClassDetail.name}
                  </h2>
                  <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{selectedClassDetail.location || 'Campo de Treino'}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{selectedClassDetail.start_time?.slice(0, 5)} às {selectedClassDetail.end_time?.slice(0, 5)}</span>
                    <span>•</span>
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{selectedClassDetail.days_of_week?.join(' • ')}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const t = classes.find(c => c.id === selectedClassDetail.id) || selectedClassDetail;
                      handleOpenAttendance(t);
                    }}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <UserCheck className="w-4 h-4" />
                    Fazer Chamada
                  </button>
                </div>
              </div>

              {/* Barra de Ocupação da Turma */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-300 font-semibold">Ocupação da Turma:</span>
                  <span className="font-bold text-white">
                    {enrolledStudents.length} / {selectedClassDetail.capacity} atletas
                  </span>
                  <span className="text-gray-300">
                    ({Math.min(Math.round((enrolledStudents.length / selectedClassDetail.capacity) * 100), 100)}% capacidade)
                  </span>
                </div>

                <div className="w-full sm:w-64 bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      enrolledStudents.length >= selectedClassDetail.capacity 
                        ? 'bg-red-400' 
                        : (enrolledStudents.length / selectedClassDetail.capacity) > 0.75 
                        ? 'bg-amber-400' 
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(Math.round((enrolledStudents.length / selectedClassDetail.capacity) * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal do Modal com Scroll */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* SEÇÃO 1: DEFINIR / ATRIBUIR PROFESSOR DA TURMA */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Dados do Professor Atual */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#112F20] text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xs font-bold text-emerald-800 uppercase tracking-wider">Professor Responsável</div>
                      <div className="text-base font-bold text-gray-900">
                        {selectedClassDetail.teacherName && selectedClassDetail.teacherName !== 'Sem Professor' 
                          ? selectedClassDetail.teacherName 
                          : 'Nenhum professor definido'}
                      </div>
                      {selectedClassDetail.teacher && (
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                          {selectedClassDetail.teacher.cref && (
                            <span className="font-medium text-emerald-700">CREF: {selectedClassDetail.teacher.cref}</span>
                          )}
                          {selectedClassDetail.teacher.phone && (
                            <span>• {maskPhone(selectedClassDetail.teacher.phone)}</span>
                          )}
                          {selectedClassDetail.teacher.email && (
                            <span>• {selectedClassDetail.teacher.email}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controle de Alteração do Professor (Apenas Gestor) */}
                  {role === 'GESTOR' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-600 mb-1">
                          Definir / Trocar Professor:
                        </label>
                        <select
                          value={detailTeacherId}
                          onChange={e => setDetailTeacherId(e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-gray-800 focus:outline-none focus:border-emerald-600 min-w-[220px]"
                        >
                          <option value="">-- Sem Professor Atribuído --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} {t.cref ? `(CREF: ${t.cref})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveTeacher}
                        disabled={savingTeacher}
                        className="self-end sm:self-auto px-4 py-2 mt-auto text-xs font-bold text-white bg-[#112F20] hover:bg-[#1E4D36] rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {savingTeacher ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Salvar Professor
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {teacherSuccessMsg && (
                  <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{teacherSuccessMsg}</span>
                  </div>
                )}

                {teacherErrorMsg && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{teacherErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: MATRÍCULA RÁPIDA DE NOVO ATLETA NESTA TURMA */}
              {role === 'GESTOR' && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Matricular Novo Atleta Nesta Turma
                      </h4>
                    </div>

                    <span className="text-2xs font-medium text-gray-500">
                      {selectedClassDetail.capacity - enrolledStudents.length > 0 
                        ? `${selectedClassDetail.capacity - enrolledStudents.length} vaga(s) restante(s)`
                        : 'Turma lotada! Limite atingido.'}
                    </span>
                  </div>

                  {enrollError && (
                    <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{enrollError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedStudentToEnroll}
                      onChange={e => setSelectedStudentToEnroll(e.target.value)}
                      disabled={availableStudents.length === 0 || enrolledStudents.length >= selectedClassDetail.capacity}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 disabled:opacity-50 font-medium"
                    >
                      {availableStudents.length === 0 ? (
                        <option value="">Nenhum atleta ativo disponível para matrícula</option>
                      ) : (
                        availableStudents.map(s => {
                          const conflict = getStudentScheduleConflict(s);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category || 'Geral'}) - Camisa #{s.shirt_number || s.shirtNumber || 'S/N'}
                              {conflict ? ` ⚠️ [Conflito: ${conflict.className} (${conflict.commonDays.join(', ')} ${conflict.time})]` : ''}
                            </option>
                          );
                        })
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={handleEnrollInDetail}
                      disabled={enrollLoading || availableStudents.length === 0 || enrolledStudents.length >= selectedClassDetail.capacity}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      {enrollLoading ? (
                        'Matriculando...'
                      ) : enrolledStudents.length >= selectedClassDetail.capacity ? (
                        'Turma Cheia'
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Matricular
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* SEÇÃO 3: LISTAGEM DOS ATLETAS MATRICULADOS COM FICHA RESUMIDA 100% */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-700" />
                      Atletas Matriculados ({enrolledStudents.length})
                    </h3>
                    <p className="text-xs text-gray-500">
                      Ficha resumida com dados esportivos, responsáveis, segurança de retirada e saúde.
                    </p>
                  </div>

                  {/* Campo de Busca Rápida de Atleta */}
                  {enrolledStudents.length > 0 && (
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, camisa, posição..."
                        value={studentSearchTerm}
                        onChange={e => setStudentSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  )}
                </div>

                {detailLoading ? (
                  <div className="py-16 text-center text-gray-500 text-sm">
                    <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                    Carregando fichas dos atletas...
                  </div>
                ) : enrolledStudents.length === 0 ? (
                  <div className="bg-gray-50/70 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-700">Nenhum atleta matriculado nesta turma</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Utilize a opção acima para matricular atletas cadastrados na escolinha nesta turma.
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    Nenhum atleta encontrado para o termo "{studentSearchTerm}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredStudents.map((aluno: any) => {
                      const age = calculateAge(aluno.dob);
                      const hasMedicalAlert = !!(aluno.medical_restrictions || aluno.allergies || aluno.medications);
                      const guardian = aluno.primaryGuardian;
                      const emergency = aluno.primaryEmergencyContact;
                      const authorizedPickup = emergency ? emergency.authorized_pickup : false;

                      return (
                        <div 
                          key={aluno.id}
                          className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all p-4.5 flex flex-col justify-between space-y-3.5 shadow-2xs"
                        >
                          {/* Topo: Identificação do Atleta */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white font-black text-sm flex items-center justify-center shadow-xs border border-emerald-700 shrink-0">
                                #{aluno.shirt_number || aluno.shirtNumber || '--'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900">{aluno.name}</h4>
                                  <span className={`px-2 py-0.2 text-3xs font-bold rounded-full ${
                                    aluno.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {aluno.status || 'ATIVO'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="font-semibold text-emerald-700">{aluno.position || 'Atleta'}</span>
                                  <span>•</span>
                                  <span>Pé {aluno.dominant_foot || aluno.dominantFoot || 'Não inf.'}</span>
                                  {age !== null && (
                                    <>
                                      <span>•</span>
                                      <span>{age} anos {aluno.dob ? `(${formatDate(aluno.dob)})` : ''}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botão de Remoção Rápida */}
                            {role === 'GESTOR' && (
                              <button
                                type="button"
                                onClick={() => handleUnenrollInDetail(aluno.id, aluno.name)}
                                className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Desvincular da turma"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Bloco 2: Alertas de Saúde & Restrições Médicas */}
                          {hasMedicalAlert ? (
                            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                              <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                                <Heart className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Atenção Médica / Restrições:</span>
                              </div>
                              <div className="space-y-0.5 text-2xs pl-5">
                                {aluno.medical_restrictions && (
                                  <p><strong>Restrição:</strong> {aluno.medical_restrictions}</p>
                                )}
                                {aluno.allergies && (
                                  <p><strong>Alergias:</strong> {aluno.allergies}</p>
                                )}
                                {aluno.medications && (
                                  <p><strong>Medicações:</strong> {aluno.medications}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg px-2.5 py-1 text-2xs text-emerald-800 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Apto para treinos (Sem restrições ou alergias registradas)</span>
                            </div>
                          )}

                          {/* Bloco 3: Responsável & Segurança de Retirada */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                            
                            {/* Responsável Legal */}
                            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
                              <div className="text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-gray-400" />
                                Responsável Legal
                              </div>
                              {guardian ? (
                                <div>
                                  <p className="font-bold text-gray-900 text-xs leading-tight">{guardian.name}</p>
                                  {guardian.phone && (
                                    <a 
                                      href={`tel:${guardian.phone}`}
                                      className="inline-flex items-center gap-1 text-2xs text-emerald-700 font-semibold hover:underline mt-1"
                                    >
                                      <Phone className="w-3 h-3" />
                                      {maskPhone(guardian.phone)}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="text-2xs text-gray-400">Não cadastrado</p>
                              )}
                            </div>

                            {/* Contato de Emergência & Retirada */}
                            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
                              <div className="text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-gray-400" />
                                  Emergência / Retirada
                                </span>
                                {authorizedPickup ? (
                                  <span className="text-3xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                    Retirada OK
                                  </span>
                                ) : (
                                  <span className="text-3xs font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded-md">
                                    Não Autorizado
                                  </span>
                                )}
                              </div>
                              {emergency ? (
                                <div>
                                  <p className="font-bold text-gray-900 text-xs leading-tight">
                                    {emergency.name} <span className="text-gray-500 text-2xs font-normal">({emergency.relationship})</span>
                                  </p>
                                  {emergency.phone && (
                                    <a 
                                      href={`tel:${emergency.phone}`}
                                      className="inline-flex items-center gap-1 text-2xs text-emerald-700 font-semibold hover:underline mt-1"
                                    >
                                      <Phone className="w-3 h-3" />
                                      {maskPhone(emergency.phone)}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="text-2xs text-gray-400">Sem contato de emergência</p>
                              )}
                            </div>

                          </div>

                          {/* Rodapé do Card: Acesso à Ficha 360° Completa */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-3xs text-gray-400">
                              CPF: {aluno.cpf && aluno.cpf !== '00000000000' ? maskCPF(aluno.cpf) : 'Não informado'}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingStudentId(aluno.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                title="Editar informações do atleta"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => setViewingProfileStudentId(aluno.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#112F20] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Ficha 360° Completa
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer do Modal */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <div className="text-2xs text-gray-500 hidden sm:block">
                Base FC Security • Controle de atletas e integridade da turma
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {role === 'GESTOR' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(selectedClassDetail)}
                    disabled={deleteLoading === selectedClassDetail.id}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      (selectedClassDetail.students?.length || 0) > 0
                        ? 'text-gray-400 bg-gray-100 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                    }`}
                    title={
                      (selectedClassDetail.students?.length || 0) > 0
                        ? `Bloqueio: Turma possui ${selectedClassDetail.students.length} aluno(s) matriculado(s)`
                        : 'Excluir turma permanentemente'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteLoading === selectedClassDetail.id ? 'Excluindo...' : 'Excluir Turma'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedClassDetail(null)}
                  className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FAZER CHAMADA (ATTENDANCE) */}
      {/* ========================================================================= */}
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

            <div className="p-4 border-b border-gray-100 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Data do Treino:
                </label>
                <input 
                  type="date"
                  value={attendanceDate}
                  onChange={e => handleAttendanceDateChange(e.target.value)}
                  className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  disabled={classStudents.length === 0}
                  className="text-2xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 px-2.5 py-1.5 rounded-lg border border-emerald-300/60 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ✓ Todos Presentes
                </button>
                <div className="flex items-center gap-1 text-2xs font-bold">
                  <span className="px-2 py-1 rounded-md bg-emerald-600 text-white shadow-2xs">{attendanceCounts.pres} Pres.</span>
                  <span className="px-2 py-1 rounded-md bg-red-600 text-white shadow-2xs">{attendanceCounts.aus} Faltas</span>
                  <span className="px-2 py-1 rounded-md bg-amber-500 text-white shadow-2xs">{attendanceCounts.just} Just.</span>
                </div>
              </div>
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-[#112F20] text-emerald-300 font-bold flex items-center justify-center text-xs shadow-xs border border-emerald-800/60">
                            {aluno.name?.charAt(0).toUpperCase()}
                          </div>
                          {(aluno.shirt_number || aluno.shirtNumber) && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-3xs font-black px-1 py-0.1 rounded-full border border-white">
                              #{aluno.shirt_number || aluno.shirtNumber}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{aluno.name}</p>
                          <p className="text-2xs text-gray-500">
                            Camisa #{aluno.shirt_number || aluno.shirtNumber || 'S/N'} • {aluno.category || 'Geral'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'PRESENTE' }))}
                          className={`px-2.5 py-1.5 text-2xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            status === 'PRESENTE'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'AUSENTE' }))}
                          className={`px-2.5 py-1.5 text-2xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            status === 'AUSENTE'
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Falta
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [aluno.id]: 'JUSTIFICADO' }))}
                          className={`px-2.5 py-1.5 text-2xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            status === 'JUSTIFICADO'
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

      {/* ========================================================================= */}
      {/* MODAL 3: NOVA TURMA */}
      {/* ========================================================================= */}
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
                  maxLength={100}
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
                    <option value="">-- Selecionar Professor --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.cref ? `(CREF: ${t.cref})` : ''}</option>
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
                    maxLength={100}
                    placeholder="Ex: Campo Principal A"
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

      {/* ========================================================================= */}
      {/* MODAL 4: FICHA 360° COMPLETA DO ATLETA (OVERLAY) */}
      {/* ========================================================================= */}
      {viewingProfileStudentId && (
        <StudentProfileModal
          studentId={viewingProfileStudentId}
          onClose={() => setViewingProfileStudentId(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDITAR ALUNO (OVERLAY) */}
      {/* ========================================================================= */}
      {editingStudentId && (
        <EditStudentModal
          studentId={editingStudentId}
          onClose={() => setEditingStudentId(null)}
          onSaved={async () => {
            if (selectedClassDetail) {
              await handleOpenClassDetail(selectedClassDetail);
            }
          }}
        />
      )}
    </div>
  );
};
