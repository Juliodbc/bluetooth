<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot='start'><ion-button fill='clear' color='dark' aria-label='Sair da sala' @click='sair'><ion-icon slot='icon-only' :icon='arrowBackOutline' /></ion-button></ion-buttons><ion-title>{{ partidaStore.anfitriao ? 'Sua mesa' : 'Mesas próximas' }}</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen='true'>
      <div class='page-shell lobby-shell'>
        <section class='lobby-head'>
          <div class='radar'><span></span><ion-icon :icon='bluetoothOutline' /></div>
          <div><p class='eyebrow'>{{ partidaStore.anfitriao ? 'Sala aberta' : 'Bluetooth ativo' }}</p><h1 class='page-heading'>{{ titulo }}</h1><p class='page-copy'>{{ subtitulo }}</p></div>
        </section>

        <div v-if='partidaStore.erro' class='error-banner'><ion-icon :icon='alertCircleOutline' />{{ partidaStore.erro }}</div>

        <template v-if='partidaStore.anfitriao'>
          <div class='section-label'><span>Jogadores</span><ion-badge color='primary'>{{ jogadores.length }}/6</ion-badge></div>
          <ion-list>
            <ion-item v-for='jogador in jogadores' :key='jogador.id'>
              <div slot='start' class='player-avatar'>{{ jogador.nome.charAt(0).toUpperCase() }}</div>
              <ion-label><h2>{{ jogador.nome }}</h2><p>{{ jogador.id === partidaStore.jogadorLocalId ? 'Você · anfitrião' : 'Pronto para jogar' }}</p></ion-label>
              <span class='status-dot' :class='{ offline: !jogador.conectado }'></span>
            </ion-item>
          </ion-list>
          <div v-if='jogadores.length < 2' class='waiting'><ion-spinner name='dots' /><span>Aguardando pelo menos mais um jogador…</span></div>
          <ion-button expand='block' :disabled='jogadores.length < 2 || partidaStore.carregando' @click='iniciarPartida'>Começar partida <ion-icon slot='end' :icon='playOutline' /></ion-button>
        </template>

        <template v-else>
          <div class='section-label'><span>Encontradas</span><ion-badge color='primary'>{{ partidaStore.salasDisponiveis.length }}</ion-badge></div>
          <div v-if='partidaStore.carregando' class='empty-state'><ion-spinner name='crescent' /><p>Procurando mesas por perto…</p></div>
          <ion-list v-else-if='partidaStore.salasDisponiveis.length'>
            <ion-item v-for='sala in partidaStore.salasDisponiveis' :key='sala.id' button :disabled='partidaStore.carregando' @click='conectar(sala)'>
              <div slot='start' class='player-avatar table-icon'><ion-icon :icon='layersOutline' /></div>
              <ion-label><h2>{{ sala.nome }}</h2><p>{{ sala.jogadoresConectados }} jogador(es) · sinal {{ sala.sinal ?? '?' }}</p></ion-label>
              <ion-spinner v-if='partidaStore.carregando' slot='end' name='crescent' />
              <ion-icon v-else slot='end' :icon='chevronForwardOutline' color='primary' />
            </ion-item>
          </ion-list>
          <div v-else class='empty-state'><div><ion-icon :icon='searchOutline' /><strong>Nenhuma mesa encontrada</strong><p>Confira se o anfitrião já abriu a sala e tente de novo.</p></div></div>
          <ion-button expand='block' fill='outline' :disabled='partidaStore.carregando' @click='buscarNovamente'><ion-icon slot='start' :icon='refreshOutline' />Buscar novamente</ion-button>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue';
import { alertCircleOutline, arrowBackOutline, bluetoothOutline, chevronForwardOutline, layersOutline, playOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';
import type { PartidaDescoberta } from '@/transport/TransporteBluetooth';

const router = useRouter();
const partidaStore = usePartidaStore();
const jogadores = computed(() => partidaStore.partidaAtual?.jogadores ?? []);
const titulo = computed(() => partidaStore.anfitriao ? 'Chame seus amigos' : 'Escolha uma mesa');
const subtitulo = computed(() => partidaStore.anfitriao ? 'Mantenha esta tela aberta enquanto os outros jogadores entram.' : 'Toque em uma partida para se conectar.');

async function iniciarPartida() { if (await partidaStore.iniciarPartida()) await router.push('/jogo'); }
async function conectar(sala: PartidaDescoberta) {
  const nome = localStorage.getItem('nomeJogador') || 'Jogador';
  await partidaStore.entrarNaSala(sala, nome);
  if (partidaStore.statusConexao === 'conectado' && partidaStore.partidaAtual) await router.push('/jogo');
}
function buscarNovamente() { void partidaStore.buscarSalas(); }
async function sair() { await partidaStore.sairDaSala(); await router.replace('/'); }
</script>

<style scoped>
.lobby-head { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 20px; margin: 16px 0 34px; }
.radar { position: relative; display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: rgba(109, 59, 245, .1); color: var(--ion-color-primary); font-size: 1.7rem; }
.radar span { position: absolute; inset: 7px; border: 1px solid rgba(109, 59, 245, .22); border-radius: inherit; animation: pulse 2s infinite; }
.section-label { display: flex; justify-content: space-between; align-items: center; margin: 0 4px 10px; color: var(--ion-color-dark); font-size: .82rem; font-weight: 900; }
.player-avatar { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 13px; background: rgba(109, 59, 245, .1); color: var(--ion-color-primary); font-weight: 900; }
.table-icon { background: rgba(240, 180, 41, .14); color: #aa7400; }
ion-item h2 { font-weight: 800; }
ion-item p { margin-top: 4px; font-size: .75rem; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--ion-color-success); box-shadow: 0 0 0 4px rgba(35, 178, 109, .1); }
.status-dot.offline { background: var(--ion-color-medium); box-shadow: none; }
.waiting { display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 72px; color: var(--ion-color-medium); font-size: .78rem; }
.empty-state strong { display: block; color: var(--ion-color-dark); }
.empty-state p { max-width: 300px; margin: 8px auto 0; font-size: .82rem; line-height: 1.5; }
.lobby-shell > ion-button { margin-top: 20px; }
@keyframes pulse { 50% { transform: scale(1.2); opacity: 0; } }
</style>
