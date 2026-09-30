export type StatusPermissao = 'desconhecida' | 'concedida' | 'negada' | 'desligado';

export interface ResultadoPermissao {
  status: StatusPermissao;
  mensagem: string;
}

export async function verificarPermissoesBluetooth(): Promise<ResultadoPermissao> {
  return {
    status: 'desconhecida',
    mensagem: 'Validação e solicitação de permissões serão tratadas na camada de serviços do app.',
  };
}
