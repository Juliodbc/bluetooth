<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot='start'><ion-back-button default-href='/' text='' /></ion-buttons><ion-title>Histórico</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen='true'>
      <div class='page-shell history-shell'>
        <p class='eyebrow'>Suas partidas</p>
        <h1 class='page-heading'>Memórias da mesa</h1>
        <p class='page-copy'>Resultados salvos neste aparelho, mesmo quando você joga sem internet.</p>

        <div v-if='carregando' class='empty-state'><ion-spinner name='crescent' /></div>
        <div v-else-if='!partidaStore.historico.length' class='empty-state empty-card'><div><ion-icon :icon='albumsOutline' /><strong>Nenhuma partida ainda</strong><p>Quando uma partida terminar, o resultado aparecerá aqui.</p><ion-button fill='clear' router-link='/'>Começar a jogar</ion-button></div></div>
        <div v-else class='history-list'>
          <article v-for='(partida, index) in partidaStore.historico' :key='partida.id' class='history-item'>
            <div class='position'>{{ index + 1 }}</div>
            <div class='match-info'><small>{{ formatarData(partida.dataInicio) }}</small><h2>{{ partida.jogadores.join(' × ') || 'Partida sem jogadores' }}</h2><p v-if='partida.vencedor'><ion-icon :icon='trophyOutline' /> Vitória de {{ partida.vencedor }}</p><p v-else>Partida finalizada</p></div>
            <ion-badge :color='partida.status === `finalizada` ? `success` : `medium`'>{{ partida.status === 'finalizada' ? 'Finalizada' : partida.status }}</ion-badge>
          </article>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonBackButton, IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue';
import { albumsOutline, trophyOutline } from 'ionicons/icons';
import { onMounted, ref } from 'vue';
import { usePartidaStore } from '@/stores/partidaStore';

const partidaStore = usePartidaStore();
const carregando = ref(true);
onMounted(async () => { try { await partidaStore.carregarHistorico(); } finally { carregando.value = false; } });
function formatarData(data: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(data)); }
</script>

<style scoped>
.history-shell > .page-copy { margin-bottom: 32px; }
.empty-card { min-height: 320px; border: 1px dashed var(--app-border); border-radius: 22px; background: var(--app-surface); }.empty-card strong { display: block; color: var(--ion-color-dark); font-size: 1rem; }.empty-card p { max-width: 280px; margin: 8px auto 12px; font-size: .8rem; line-height: 1.5; }
.history-list { display: grid; gap: 12px; }
.history-item { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 13px; padding: 16px; border: 1px solid var(--app-border); border-radius: 20px; background: var(--app-surface); box-shadow: 0 8px 24px rgba(48, 35, 91, .05); }
.position { display: grid; place-items: center; width: 38px; height: 46px; border-radius: 10px; background: rgba(109, 59, 245, .1); color: var(--ion-color-primary); font-weight: 900; }
.match-info { min-width: 0; }.match-info small { color: var(--ion-color-medium); font-size: .62rem; text-transform: capitalize; }.match-info h2 { margin: 3px 0; overflow: hidden; color: var(--ion-color-dark); font-size: .86rem; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.match-info p { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--ion-color-medium); font-size: .68rem; }.match-info p ion-icon { color: var(--ion-color-secondary); }
@media (max-width: 420px) { .history-item { grid-template-columns: auto 1fr; }.history-item ion-badge { grid-column: 2; justify-self: start; } }
</style>
