<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot='start'><ion-button fill='clear' color='dark' aria-label='Sair da partida' @click='sair'><ion-icon slot='icon-only' :icon='closeOutline' /></ion-button></ion-buttons><ion-title>{{ partida?.nome ?? 'Partida' }}</ion-title><ion-badge slot='end' class='round-badge'>Rodada {{ partida?.rodadaAtual ?? 1 }}</ion-badge></ion-toolbar></ion-header>
    <ion-content :fullscreen='true'>
      <div v-if='partida && jogadorLocal' class='page-shell game-shell'>
        <div class='connection' :class='{ lost: statusConexao !== `conectado` }'><span></span>{{ statusConexao === 'conectado' ? 'Bluetooth conectado' : 'Conexão perdida' }}</div>

        <section class='turn-card' :class='{ mine: isMinhaVez }'>
          <div class='turn-icon'><ion-icon :icon='isMinhaVez ? handRightOutline : hourglassOutline' /></div>
          <div><p>{{ isMinhaVez ? 'É a sua vez' : 'Aguarde um instante' }}</p><h1>{{ isMinhaVez ? 'Escolha uma carta' : `${jogadorAtual?.nome ?? 'Outro jogador'} está jogando` }}</h1><small>{{ isMinhaVez ? `Você vai passar para ${proximoJogador?.nome ?? 'o próximo jogador'}` : 'A mesa será atualizada automaticamente' }}</small></div>
        </section>

        <div class='score-strip'>
          <div v-for='jogador in partida.jogadores' :key='jogador.id' :class='{ active: jogadorAtual?.id === jogador.id }'>
            <span class='mini-avatar'>{{ jogador.nome.charAt(0).toUpperCase() }}</span>
            <strong>{{ jogador.id === jogadorLocalId ? 'Você' : primeiroNome(jogador.nome) }}</strong>
            <small>{{ jogador.mao.length || '?' }} cartas · {{ jogador.letrasBurro.join('') || '—' }}</small>
          </div>
        </div>

        <div class='hand-heading'><div><p class='eyebrow'>Sua mão</p><h2>{{ jogadorLocal.mao.length }} cartas</h2></div><small>Toque para selecionar</small></div>
        <div v-if='jogadorLocal.mao.length' class='mao'>
          <button v-for='carta in jogadorLocal.mao' :key='carta.id' type='button' class='carta' :class='{ selected: cartaSelecionada?.id === carta.id, red: isNaipeVermelho(carta.naipe) }' :disabled='!isMinhaVez || carregando' @click='selecionarCarta(carta)'>
            <span>{{ carta.valor }}</span><strong>{{ simboloNaipe(carta.naipe) }}</strong><small>{{ carta.valor }}</small>
          </button>
        </div>
        <div v-else class='empty-hand'>Aguardando a distribuição das cartas…</div>

        <div v-if='erro' class='error-banner'><ion-icon :icon='alertCircleOutline' />{{ erro }}</div>
        <div class='acoes'>
          <ion-button expand='block' :disabled='!cartaSelecionada || !isMinhaVez || carregando' @click='passarCarta'><ion-spinner v-if='carregando' name='crescent' /><template v-else>Passar carta <ion-icon slot='end' :icon='arrowForwardOutline' /></template></ion-button>
          <ion-button expand='block' fill='outline' color='warning' :disabled='!podeBater || carregando' @click='bater'><ion-icon slot='start' :icon='flashOutline' />Bati!</ion-button>
        </div>
      </div>
      <div v-else class='page-shell empty-state'><div><ion-icon :icon='layersOutline' /><p>Nenhuma partida ativa.</p><ion-button fill='clear' router-link='/'>Voltar ao início</ion-button></div></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue';
import { alertCircleOutline, arrowForwardOutline, closeOutline, flashOutline, handRightOutline, hourglassOutline, layersOutline } from 'ionicons/icons';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';
import type { Carta } from '@/types';

const router = useRouter();
const store = usePartidaStore();
const cartaSelecionada = ref<Carta | null>(null);
const partida = computed(() => store.partidaAtual);
const jogadorLocal = computed(() => store.jogadorLocal);
const jogadorAtual = computed(() => store.jogadorAtual);
const proximoJogador = computed(() => store.proximoJogadorLocal);
const jogadorLocalId = computed(() => store.jogadorLocalId);
const statusConexao = computed(() => store.statusConexao);
const erro = computed(() => store.erro);
const carregando = computed(() => store.carregando);
const isMinhaVez = computed(() => jogadorAtual.value?.id === jogadorLocalId.value);
const podeBater = computed(() => {
  const contagem = new Map<string, number>();
  jogadorLocal.value?.mao.forEach((carta) => contagem.set(carta.valor, (contagem.get(carta.valor) ?? 0) + 1));
  return [...contagem.values()].some((quantidade) => quantidade >= 4);
});

watch(() => partida.value?.status, (status) => { if (status === 'finalizada') void router.replace('/resultado'); });
function selecionarCarta(carta: Carta) { cartaSelecionada.value = cartaSelecionada.value?.id === carta.id ? null : carta; }
async function passarCarta() { if (cartaSelecionada.value && await store.passarCarta(cartaSelecionada.value)) cartaSelecionada.value = null; }
async function bater() { if (await store.bater() && store.resultadoRodada) await router.push('/resultado'); }
async function sair() { await store.sairDaSala(); await router.replace('/'); }
function primeiroNome(nome: string) { return nome.split(' ')[0]; }
function isNaipeVermelho(naipe: string) { return naipe === 'copas' || naipe === 'ouros'; }
function simboloNaipe(naipe: string) { return ({ copas: '♥', ouros: '♦', paus: '♣', espadas: '♠' } as Record<string, string>)[naipe] ?? naipe.charAt(0); }
</script>

<style scoped>
.round-badge { margin-right: 14px; }
.connection { display: flex; justify-content: center; align-items: center; gap: 7px; margin-bottom: 14px; color: var(--ion-color-success); font-size: .7rem; font-weight: 800; }
.connection span { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px rgba(35, 178, 109, .1); }
.connection.lost { color: var(--ion-color-danger); }
.turn-card { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 15px; padding: 18px; border: 1px solid var(--app-border); border-radius: 22px; background: var(--app-surface); }
.turn-card.mine { border-color: rgba(109, 59, 245, .28); background: linear-gradient(135deg, rgba(109, 59, 245, .12), var(--app-surface)); }
.turn-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 15px; background: rgba(109, 59, 245, .12); color: var(--ion-color-primary); font-size: 1.4rem; }
.turn-card p, .turn-card h1, .turn-card small { margin: 0; }
.turn-card p { color: var(--ion-color-primary); font-size: .7rem; font-weight: 900; text-transform: uppercase; }
.turn-card h1 { margin: 3px 0; color: var(--ion-color-dark); font-size: 1.12rem; font-weight: 900; }
.turn-card small { color: var(--ion-color-medium); font-size: .69rem; }
.score-strip { display: flex; gap: 9px; margin: 14px 0 28px; overflow-x: auto; scrollbar-width: none; }
.score-strip > div { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; min-width: 138px; padding: 10px; border: 1px solid var(--app-border); border-radius: 15px; background: var(--app-surface); }
.score-strip > div.active { border-color: var(--ion-color-primary); }
.mini-avatar { grid-row: span 2; display: grid; place-items: center; width: 29px; height: 29px; border-radius: 9px; background: rgba(109, 59, 245, .1); color: var(--ion-color-primary); font-weight: 900; }
.score-strip strong { font-size: .72rem; }.score-strip small { color: var(--ion-color-medium); font-size: .62rem; }
.hand-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 14px; }.hand-heading p, .hand-heading h2 { margin: 0; }.hand-heading h2 { color: var(--ion-color-dark); font-size: 1.2rem; }.hand-heading > small { color: var(--ion-color-medium); font-size: .68rem; }
.mao { display: flex; gap: 10px; padding: 8px 4px 22px; overflow-x: auto; scrollbar-width: none; }
.carta { display: grid; grid-template-rows: auto 1fr auto; flex: 0 0 76px; height: 108px; padding: 9px; border: 1px solid rgba(23, 21, 42, .12); border-radius: 12px; background: #fff; box-shadow: 0 8px 18px rgba(23, 21, 42, .1); color: #17152a; text-align: left; transition: .18s ease; }
.carta strong { place-self: center; font-size: 1.8rem; }.carta small { justify-self: end; transform: rotate(180deg); }.carta.red { color: #df365c; }.carta.selected { border-color: var(--ion-color-primary); box-shadow: 0 0 0 3px rgba(109, 59, 245, .18); transform: translateY(-8px); }.carta:disabled { opacity: .55; }
.empty-hand { padding: 32px; border: 1px dashed var(--app-border); border-radius: 18px; color: var(--ion-color-medium); text-align: center; font-size: .8rem; }
.acoes { display: grid; gap: 10px; margin-top: 10px; }
@media (min-width: 600px) { .acoes { grid-template-columns: 2fr 1fr; } }
</style>
