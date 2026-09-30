import { BluetoothLowEnergy } from '@capgo/capacitor-bluetooth-low-energy';

import type { Mensagem } from '@/types';
import { VERSAO_PROTOCOLO } from '@/types';

import { deserializarMensagem, fragmentarMensagem } from './protocolo';
import type { PartidaDescoberta, TransporteBluetooth } from './TransporteBluetooth';

const SERVICO_JOGO_UUID = '8a6e0001-2de2-4f20-a2f1-8b0f55f4b001';
const CARACTERISTICA_MENSAGENS_UUID = '8a6e0002-2de2-4f20-a2f1-8b0f55f4b001';
const CARACTERISTICA_PARTIDA_UUID = '8a6e0003-2de2-4f20-a2f1-8b0f55f4b001';
const TAMANHO_FRAGMENTO_BLE = 5;

type PapelBluetooth = 'anfitriao' | 'convidado';

export class TransporteBluetoothReal implements TransporteBluetooth {
  private readonly ouvintes = new Set<(mensagem: Mensagem, origemId?: string) => void>();
  private readonly ouvintesDesconexao = new Set<(motivo: string, jogadorId?: string) => void>();
  private readonly fragmentosRecebidos = new Map<string, { total: number; partes: Map<number, string> }>();
  private readonly listeners: Array<{ remove: () => Promise<void> }> = [];
  private readonly dispositivosPorJogador = new Map<string, string>();
  private enderecoConectado?: string;
  private idPartidaAnunciada = '';
  private inicializado = false;

  constructor(private readonly papel: PapelBluetooth) {}

  async iniciarAnfitriao(partidaId = ''): Promise<void> {
    if (this.papel !== 'anfitriao') {
      throw new Error('Este transporte foi configurado como convidado');
    }

    await this.inicializar('peripheral');
    this.idPartidaAnunciada = partidaId;
    await BluetoothLowEnergy.addGattService({
      service: SERVICO_JOGO_UUID,
      characteristics: [
        {
          uuid: CARACTERISTICA_PARTIDA_UUID,
          properties: {
            broadcast: false,
            read: true,
            writeWithoutResponse: false,
            write: false,
            notify: false,
            indicate: false,
            authenticatedSignedWrites: false,
            extendedProperties: false,
          },
          value: Array.from(new TextEncoder().encode(partidaId)),
        },
        {
          uuid: CARACTERISTICA_MENSAGENS_UUID,
          properties: {
            broadcast: false,
            read: false,
            writeWithoutResponse: false,
            write: true,
            notify: true,
            indicate: false,
            authenticatedSignedWrites: false,
            extendedProperties: false,
          },
          value: [],
        },
      ],
    });
    await BluetoothLowEnergy.startAdvertising({
      name: 'Burro',
      services: [SERVICO_JOGO_UUID],
      includeName: true,
    });
  }

  async procurarPartidas(): Promise<PartidaDescoberta[]> {
    if (this.papel !== 'convidado') {
      throw new Error('A busca por partidas está disponível apenas para convidados');
    }

    await this.inicializar('central');
    const encontradas = new Map<string, PartidaDescoberta>();
    const listener = await BluetoothLowEnergy.addListener('deviceScanned', ({ device }) => {
      if (!device.serviceUuids?.some((uuid) => uuid.toLowerCase() === SERVICO_JOGO_UUID)) {
        return;
      }

      encontradas.set(device.deviceId, {
        id: device.deviceId,
        nome: device.name || 'Partida Burro',
        jogadoresConectados: 0,
        sinal: device.rssi,
      });
    });

    try {
      await BluetoothLowEnergy.startScan({ services: [SERVICO_JOGO_UUID], timeout: 6000 });
      await new Promise((resolve) => setTimeout(resolve, 6000));
      return [...encontradas.values()];
    } finally {
      await BluetoothLowEnergy.stopScan();
      await listener.remove();
    }
  }

  async conectar(partidaId: string, jogadorId: string): Promise<string> {
    if (this.papel !== 'convidado') {
      throw new Error('A conexão como convidado não está disponível no modo anfitrião');
    }

    await this.inicializar('central');
    await BluetoothLowEnergy.connect({ deviceId: partidaId });
    this.enderecoConectado = partidaId;
    await BluetoothLowEnergy.discoverServices({ deviceId: partidaId });
    await BluetoothLowEnergy.startCharacteristicNotifications({
      deviceId: partidaId,
      service: SERVICO_JOGO_UUID,
      characteristic: CARACTERISTICA_MENSAGENS_UUID,
    });
    const partida = await BluetoothLowEnergy.readCharacteristic({
      deviceId: partidaId,
      service: SERVICO_JOGO_UUID,
      characteristic: CARACTERISTICA_PARTIDA_UUID,
    });
    const idPartida = new TextDecoder().decode(new Uint8Array(partida.value));
    if (!idPartida) {
      throw new Error('O dispositivo não anunciou um identificador de partida');
    }
    this.dispositivosPorJogador.set(jogadorId, partidaId);
    return idPartida;
  }

  async enviar(idDestino: string, mensagem: Mensagem): Promise<void> {
    const destino = this.papel === 'anfitriao' ? undefined : (this.enderecoConectado ?? idDestino);
    if (this.papel === 'convidado' && !destino) {
      throw new Error('Nenhuma sala Bluetooth está conectada');
    }

    for (const fragmento of fragmentarMensagem(mensagem, TAMANHO_FRAGMENTO_BLE)) {
      const bytes = Array.from(new TextEncoder().encode(fragmento));
      if (this.papel === 'anfitriao') {
        const destinoFisico = idDestino ? this.dispositivosPorJogador.get(idDestino) : undefined;
        if (idDestino && !destinoFisico) {
          throw new Error('O jogador destinatário não está conectado');
        }
        await BluetoothLowEnergy.notifyGattCharacteristicChanged({
          service: SERVICO_JOGO_UUID,
          characteristic: CARACTERISTICA_MENSAGENS_UUID,
          value: bytes,
          ...(destinoFisico ? { deviceId: destinoFisico } : {}),
        });
      } else {
        await BluetoothLowEnergy.writeCharacteristic({
          deviceId: destino!,
          service: SERVICO_JOGO_UUID,
          characteristic: CARACTERISTICA_MENSAGENS_UUID,
          value: bytes,
          type: 'withResponse',
        });
      }
    }
  }

  aoReceber(callback: (mensagem: Mensagem, origemId?: string) => void): () => void {
    this.ouvintes.add(callback);
    return () => this.ouvintes.delete(callback);
  }

  aoDesconectar(callback: (motivo: string, jogadorId?: string) => void): () => void {
    this.ouvintesDesconexao.add(callback);
    return () => this.ouvintesDesconexao.delete(callback);
  }

  async desconectar(idDestino?: string): Promise<void> {
    if (this.papel === 'anfitriao') {
      await BluetoothLowEnergy.stopAdvertising();
    } else {
      const destino = idDestino ?? this.enderecoConectado;
      if (destino) {
        await BluetoothLowEnergy.disconnect({ deviceId: destino });
      }
      this.enderecoConectado = undefined;
      this.dispositivosPorJogador.clear();
    }

    await Promise.all(this.listeners.splice(0).map((listener) => listener.remove()));
    this.inicializado = false;
  }

  private async inicializar(modo: 'central' | 'peripheral'): Promise<void> {
    if (this.inicializado) {
      return;
    }

    const permissoes = await BluetoothLowEnergy.requestPermissions();
    if (permissoes.bluetooth !== 'granted') {
      throw new Error('A permissão de Bluetooth não foi concedida');
    }

    await BluetoothLowEnergy.initialize({ mode: modo });
    if (modo === 'central') {
      this.listeners.push(await BluetoothLowEnergy.addListener('characteristicChanged', (event) => {
        if (event.service === SERVICO_JOGO_UUID && event.characteristic === CARACTERISTICA_MENSAGENS_UUID) {
          this.receberFragmento(event.deviceId, event.value);
        }
      }));
      this.listeners.push(await BluetoothLowEnergy.addListener('deviceDisconnected', ({ deviceId }) => {
        if (deviceId === this.enderecoConectado) {
          this.enderecoConectado = undefined;
          this.emitirDesconexao('dispositivo desconectado');
        }
      }));
    } else {
      this.listeners.push(await BluetoothLowEnergy.addListener('gattCharacteristicWriteRequest', (event) => {
        if (event.service === SERVICO_JOGO_UUID && event.characteristic === CARACTERISTICA_MENSAGENS_UUID) {
          this.receberFragmento(event.deviceId, event.value);
        }
      }));
      this.listeners.push(await BluetoothLowEnergy.addListener('centralDisconnected', ({ deviceId }) => {
        const jogadorId = [...this.dispositivosPorJogador.entries()]
          .find(([, endereco]) => endereco === deviceId)?.[0];
        if (jogadorId) this.dispositivosPorJogador.delete(jogadorId);
        this.emitirDesconexao(`dispositivo ${deviceId} desconectado`, jogadorId);
      }));
    }

    this.inicializado = true;
  }

  private receberFragmento(origemId: string, bytes: number[]): void {
    const texto = new TextDecoder().decode(new Uint8Array(bytes));
    const cabecalho = texto.match(/^f:(\d+)\/(\d+):([\s\S]*)$/);

    try {
      if (!cabecalho) {
        this.emitirMensagem(deserializarMensagem(texto), origemId);
        return;
      }

      const indice = Number(cabecalho[1]);
      const total = Number(cabecalho[2]);
      const buffer = this.fragmentosRecebidos.get(origemId) ?? { total, partes: new Map<number, string>() };
      if (buffer.total !== total || indice < 1 || indice > total) {
        this.fragmentosRecebidos.delete(origemId);
        return;
      }

      buffer.partes.set(indice, cabecalho[3]);
      this.fragmentosRecebidos.set(origemId, buffer);
      if (buffer.partes.size === total) {
        const mensagemCompleta = Array.from({ length: total }, (_, i) => buffer.partes.get(i + 1) ?? '').join('');
        this.fragmentosRecebidos.delete(origemId);
        this.emitirMensagem(deserializarMensagem(mensagemCompleta), origemId);
      }
    } catch {
      this.fragmentosRecebidos.delete(origemId);
    }
  }

  private emitirMensagem(mensagem: Mensagem, origemId: string): void {
    if (mensagem.versao !== VERSAO_PROTOCOLO) {
      return;
    }
    if (this.papel === 'anfitriao') {
      const dispositivoConhecido = this.dispositivosPorJogador.get(mensagem.jogadorId);
      if (dispositivoConhecido && dispositivoConhecido !== origemId) {
        return;
      }
      if (!dispositivoConhecido && mensagem.tipo !== 'SOLICITACAO_ENTRADA') {
        return;
      }
      this.dispositivosPorJogador.set(mensagem.jogadorId, origemId);
    }
    for (const callback of this.ouvintes) {
      callback(mensagem, origemId);
    }
  }

  private emitirDesconexao(motivo: string, jogadorId?: string): void {
    for (const callback of this.ouvintesDesconexao) {
      callback(motivo, jogadorId);
    }
  }
}