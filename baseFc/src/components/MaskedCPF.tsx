import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { maskCPF, redactCPF } from '../utils/masks.ts';

interface MaskedCPFProps {
  value: string | null | undefined;
  emptyText?: string;
}

/**
 * Exibe o CPF oculto (***.***.***-**) por padrão (Data Masking).
 * O ícone de olho revela/oculta o valor apenas localmente, por item.
 */
export const MaskedCPF = ({ value, emptyText = 'Não informado' }: MaskedCPFProps) => {
  const [visible, setVisible] = useState(false);

  if (!value || value === '00000000000') return <>{emptyText}</>;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono">{visible ? maskCPF(value) : redactCPF(value)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible((v) => !v);
        }}
        className="p-0.5 text-gray-400 hover:text-emerald-600 transition-colors"
        aria-label={visible ? 'Ocultar CPF' : 'Mostrar CPF'}
        title={visible ? 'Ocultar CPF' : 'Mostrar CPF'}
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </span>
  );
};
