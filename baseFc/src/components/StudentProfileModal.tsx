import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  X, User, ShieldCheck, Heart, CalendarCheck, CreditCard, 
  Phone, AlertTriangle, CheckCircle2, XCircle, Clock, Mail
} from 'lucide-react';
import { maskCPF, maskPhone } from '../utils/masks.ts';

interface Props {
  studentId: string;
  onClose: () => void;
}

export const StudentProfileModal = ({ studentId, onClose }: Props) => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dados' | 'responsaveis' | 'saude' | 'frequencia' | 'mensalidades'>('dados');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchApi(`/students/${studentId}/profile`, {}, token);
        setProfile(data);
      } catch (err) {
        console.error('Falha ao carregar perfil do atleta', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [studentId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando ficha 360° do atleta...</p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.student) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
          <p className="text-red-600 font-medium mb-4">Não foi possível carregar os dados do atleta.</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700">Fechar</button>
        </div>
      </div>
    );
  }

  const { student, guardians, emergencyContacts, classes, payments, attendance } = profile;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header do Perfil */}
        <div className="bg-[#112F20] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-500/20 border-2 border-green-400 text-green-300 font-bold text-2xl rounded-2xl flex items-center justify-center shadow-inner">
              #{student.shirtNumber || student.shirt_number || '--'}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  student.status === 'ATIVO' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300'
                }`}>
                  {student.status}
                </span>
              </div>
              <p className="text-green-200 text-sm mt-1">
                {student.category} • {student.position} • Pé {student.dominantFoot || student.dominant_foot || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex space-x-2 mt-6 border-b border-white/10 overflow-x-auto">
            <TabButton active={activeTab === 'dados'} onClick={() => setActiveTab('dados')} icon={<User className="w-4 h-4 mr-2" />} label="Atleta" />
            <TabButton active={activeTab === 'responsaveis'} onClick={() => setActiveTab('responsaveis')} icon={<ShieldCheck className="w-4 h-4 mr-2" />} label="Responsáveis" />
            <TabButton active={activeTab === 'saude'} onClick={() => setActiveTab('saude')} icon={<Heart className="w-4 h-4 mr-2" />} label="Emergência & Retirada" />
            <TabButton active={activeTab === 'frequencia'} onClick={() => setActiveTab('frequencia')} icon={<CalendarCheck className="w-4 h-4 mr-2" />} label={`Frequência (${attendance.attendanceRate}%)`} />
            <TabButton active={activeTab === 'mensalidades'} onClick={() => setActiveTab('mensalidades')} icon={<CreditCard className="w-4 h-4 mr-2" />} label="Mensalidades" />
          </div>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ABA 1: DADOS GERAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoBox label="Data de Nascimento" value={student.dob || 'Não informada'} />
                <InfoBox label="CPF do Atleta" value={student.cpf && student.cpf !== '00000000000' ? maskCPF(student.cpf) : 'Não informado'} />
                <InfoBox label="Categoria" value={student.category} />
                <InfoBox label="Posição em Campo" value={student.position} />
                <InfoBox label="Pé Dominante" value={student.dominantFoot || student.dominant_foot || 'Não informado'} />
                <InfoBox label="Número da Camisa" value={student.shirtNumber || student.shirt_number ? `Camisa #${student.shirtNumber || student.shirt_number}` : 'Não informado'} />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Turma Matriculada</h4>
                {classes.length === 0 ? (
                  <p className="text-sm text-gray-500">Este atleta ainda não foi alocado em nenhuma turma.</p>
                ) : (
                  classes.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-800">{c.name} ({c.category})</span>
                      <span className="text-gray-500">{c.days_of_week?.join(', ')} • {c.start_time?.slice(0,5)} às {c.end_time?.slice(0,5)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ABA 2: RESPONSÁVEIS */}
          {activeTab === 'responsaveis' && (
            <div className="space-y-4">
              {guardians.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum responsável cadastrado para este atleta.</div>
              ) : (
                guardians.map((g: any) => (
                  <div key={g.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="font-bold text-gray-900 text-base">{g.name}</div>
                        {g.hasPortalAccess ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Portal Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Apenas Contato
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div>CPF: {g.cpf ? maskCPF(g.cpf) : 'Não informado'}</div>
                        {g.email ? (
                          <div className="flex items-center text-gray-700 font-medium">
                            <Mail className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                            {g.email}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">Sem e-mail para acesso ao portal</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <a href={`tel:${g.phone}`} className="inline-flex items-center text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                        <Phone className="w-4 h-4 mr-1.5" /> {g.phone ? maskPhone(g.phone) : 'Sem telefone'}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABA 3: SAÚDE, EMERGÊNCIA & RETIRADA */}
          {activeTab === 'saude' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Pessoas Autorizadas para Retirada do Menor
                </h4>
                {emergencyContacts.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum contato de emergência cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {emergencyContacts.map((c: any) => (
                      <div key={c.id} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between bg-white shadow-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">{c.name}</span>
                            <span className="text-xs text-gray-500">({c.relationship})</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Contato: {c.phone ? maskPhone(c.phone) : 'Não informado'}</div>
                          {c.notes && (
                            <div className="text-xs text-amber-700 mt-1 font-medium bg-amber-50 px-2 py-0.5 rounded-sm inline-block">
                              Obs: {c.notes}
                            </div>
                          )}
                        </div>
                        <div>
                          {c.authorized_pickup ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Autorizado a Retirar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" /> Não Autorizado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: FREQUÊNCIA */}
          {activeTab === 'frequencia' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{attendance.totalTrainings}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">Total Treinos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-700">{attendance.presences}</div>
                  <div className="text-xs text-green-600 mt-1 uppercase">Presenças</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="text-2xl font-bold text-red-700">{attendance.absences}</div>
                  <div className="text-xs text-red-600 mt-1 uppercase">Faltas</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{attendance.attendanceRate}%</div>
                  <div className="text-xs text-blue-600 mt-1 uppercase">Assiduidade</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Histórico Recente de Treinos</h4>
                {attendance.history.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum treino registrado até o momento.</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.history.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{h.date}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          h.status === 'PRESENTE' ? 'bg-green-100 text-green-700' :
                          h.status === 'AUSENTE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 5: MENSALIDADES */}
          {activeTab === 'mensalidades' && (
            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma mensalidade emitida para este atleta.</div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {payments.map((p: any) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                      <div>
                        <div className="font-bold text-gray-900">Competência: {p.competence}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Vencimento: {p.due_date}</div>
                        {p.paid_at && (
                          <div className="text-xs text-green-600 mt-0.5 font-medium">Pago em {p.paid_at.slice(0, 10)} via {p.payment_method}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">R$ {Number(p.amount).toFixed(2)}</div>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          p.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                          p.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
      active 
        ? 'border-green-400 text-green-300 bg-white/5 rounded-t-lg' 
        : 'border-transparent text-gray-400 hover:text-gray-200'
    }`}
  >
    {icon}
    {label}
  </button>
);

const InfoBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
    <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
    <div className="text-sm font-bold text-gray-900 mt-1">{value}</div>
  </div>
);
