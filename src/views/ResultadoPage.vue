<template>
  <ion-page>
    <ion-content :fullscreen='true'>
      <div class='page-shell result-shell'>
        <div class='confetti' aria-hidden='true'>✦ <span>◆</span> ✦</div>
        <div class='trophy'><ion-icon :icon='trophyOutline' /></div>
        <p class='eyebrow'>{{ finalizada ? 'Fim de jogo' : `Rodada ${partidaStore.resultadoRodada?.rodada ?? ''}` }}</p>
        <h1 class='page-heading'>{{ finalizada ? 'Partida encerrada!' : 'Rodada encerrada!' }}</h1>
        <p class='page-copy'>{{ finalizada ? 'Confira o resultado final da mesa.' : 'Respirem fundo: ainda tem jogo pela frente.' }}</p>

        <ion-card class='result-card'>
          <div class='result-row winner'><div class='result-icon'><ion-icon :icon='ribbonOutline' /></div><div><small>Venceu a rodada</small><strong>{{ nomeDoJogador(partidaStore.resultadoRodada?.vencedorId) }}</strong></div></div>
          <div class='result-row'><div class='result-icon penalty'>B</div><div><small>Recebeu uma letra</small><strong>{{ nomeDoJogador(partidaStore.resultadoRodada?.penalizadoId) }}</strong></div></div>
          <div class='reason'><span>Motivo</span><p>{{ partidaStore.resultadoRodada?.motivoPenalidade ?? 'Resultado sincronizado' }}</p></div>
        </ion-card>

        <div class='actions'>
          <ion-button expand='block' @click='acaoPrincipal'>{{ finalizada ? 'Jogar novamente' : 'Continuar partida' }}<ion-icon slot='end' :icon='arrowForwardOutline' /></ion-button>
          <ion-button expand='block' fill='clear' @click='verHistorico'><ion-icon slot='start' :icon='timeOutline' />Ver histórico</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonButton, IonCard, IonContent, IonIcon, IonPage } from '@ionic/vue';
import { arrowForwardOutline, ribbonOutline, timeOutline, trophyOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';

const router = useRouter();
const partidaStore = usePartidaStore();
const finalizada = computed(() => partidaStore.partidaAtual?.status === 'finalizada');
function nomeDoJogador(id?: string) { return partidaStore.partidaAtual?.jogadores.find((j) => j.id === id)?.nome ?? 'Aguardando sincronização'; }
async function acaoPrincipal() {
  if (!finalizada.value) { await router.replace('/jogo'); return; }
  await partidaStore.sairDaSala();
  await router.replace('/');
}
function verHistorico() { void router.push('/historico'); }
</script>

<style scoped>
.result-shell { display: flex; flex-direction: column; justify-content: center; max-width: 560px; text-align: center; }
.confetti { margin-bottom: 8px; color: var(--ion-color-secondary); font-size: 1.1rem; letter-spacing: 1.5rem; }.confetti span { color: var(--ion-color-primary); }
.trophy { display: grid; place-items: center; width: 82px; height: 82px; margin: 0 auto 24px; border-radius: 27px; background: linear-gradient(135deg, #f8d66d, var(--ion-color-secondary)); box-shadow: 0 16px 32px rgba(240, 180, 41, .25); color: #5b3c00; font-size: 2.5rem; transform: rotate(-4deg); }
.result-card { margin-top: 32px; padding: 8px 20px 20px; text-align: left; }
.result-row { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--app-border); }
.result-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: rgba(35, 178, 109, .1); color: var(--ion-color-success); font-size: 1.3rem; font-weight: 900; }.result-icon.penalty { background: rgba(239, 71, 111, .1); color: var(--ion-color-danger); }
.result-row div:last-child { display: grid; gap: 3px; }.result-row small, .reason span { color: var(--ion-color-medium); font-size: .68rem; font-weight: 800; text-transform: uppercase; }.result-row strong { color: var(--ion-color-dark); font-size: 1rem; }
.reason { padding-top: 16px; }.reason p { margin: 5px 0 0; color: var(--ion-color-dark); font-size: .82rem; line-height: 1.45; }
.actions { display: grid; gap: 8px; margin-top: 24px; }
</style>
