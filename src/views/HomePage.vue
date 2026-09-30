<template>
  <ion-page>
    <ion-content :fullscreen='true'>
      <div class='page-shell home-shell'>
        <header class='brand'><span class='brand-mark'>B</span><span>Burro</span><ion-badge color='success'>offline</ion-badge></header>
        <section class='hero'>
          <div class='card-fan' aria-hidden='true'><span>♣</span><span>♦</span><span>♠</span></div>
          <p class='eyebrow'>Jogo de cartas local</p>
          <h1>Junte a galera.<br><em>Sem internet.</em></h1>
          <p>Crie uma mesa por Bluetooth, conecte os amigos e descubra quem vai completar B-U-R-R-O primeiro.</p>
        </section>
        <div class='actions'>
          <ion-button expand='block' @click='criarPartida'><ion-icon slot='start' :icon='addCircleOutline' />Criar uma partida</ion-button>
          <ion-button expand='block' fill='outline' @click='procurarPartidas'><ion-icon slot='start' :icon='searchOutline' />Encontrar uma mesa</ion-button>
        </div>
        <button class='history-link' type='button' @click='irParaHistorico'><ion-icon :icon='timeOutline' /><span><strong>Histórico de partidas</strong><small>Veja seus jogos anteriores</small></span><ion-icon :icon='chevronForwardOutline' /></button>
        <div class='offline-note'><ion-icon :icon='bluetoothOutline' /><span><strong>100% local</strong> — nenhum dado sai dos aparelhos.</span></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonBadge, IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue';
import { addCircleOutline, bluetoothOutline, chevronForwardOutline, searchOutline, timeOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();
function irParaIdentificacao(tipo: 'host' | 'guest') { router.push({ path: '/identificacao', query: { tipo } }); }
function criarPartida() { irParaIdentificacao('host'); }
function procurarPartidas() { irParaIdentificacao('guest'); }
function irParaHistorico() { router.push('/historico'); }
</script>

<style scoped>
.home-shell { display: flex; flex-direction: column; justify-content: center; max-width: 560px; }
.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; color: var(--ion-color-dark); font-size: 1.12rem; font-weight: 900; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 42px; border-radius: 9px; background: var(--ion-color-primary); box-shadow: 5px 5px 0 rgba(240, 180, 41, .65); color: #fff; transform: rotate(-5deg); }
.brand ion-badge { margin-left: auto; }
.hero { position: relative; padding: 20px 0 28px; }
.hero h1 { margin: 0; color: var(--ion-color-dark); font-size: clamp(2.65rem, 13vw, 4.25rem); font-weight: 900; line-height: .96; letter-spacing: -.065em; }
.hero h1 em { color: var(--ion-color-primary); font-style: normal; }
.hero > p:last-child { max-width: 440px; margin: 18px 0 0; color: var(--ion-color-medium); line-height: 1.6; }
.card-fan { position: absolute; top: -8px; right: 4px; display: flex; opacity: .14; transform: rotate(8deg); }
.card-fan span { display: grid; place-items: center; width: 38px; height: 54px; margin-left: -16px; border: 2px solid var(--ion-color-primary); border-radius: 8px; background: var(--app-surface); color: var(--ion-color-primary); font-size: 1.3rem; }
.actions { display: grid; gap: 12px; margin-top: 14px; }
.history-link { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; width: 100%; margin-top: 26px; padding: 17px 2px; border: 0; border-block: 1px solid var(--app-border); background: transparent; color: var(--ion-color-dark); text-align: left; cursor: pointer; }
.history-link > ion-icon { color: var(--ion-color-primary); font-size: 1.3rem; }
.history-link span { display: grid; gap: 3px; }
.history-link small { color: var(--ion-color-medium); font-size: .76rem; }
.offline-note { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 22px; color: var(--ion-color-medium); font-size: .74rem; }
.offline-note ion-icon { color: var(--ion-color-primary); font-size: 1rem; }
@media (min-width: 600px) { .actions { grid-template-columns: 1fr 1fr; } }
</style>
