<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Resultado</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ partidaStore.partidaAtual?.status === 'finalizada' ? 'Partida encerrada' : 'Rodada encerrada' }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Vencedor da rodada:</strong> {{ nomeDoJogador(partidaStore.resultadoRodada?.vencedorId) }}</p>
          <p><strong>Penalizado:</strong> {{ nomeDoJogador(partidaStore.resultadoRodada?.penalizadoId) }}</p>
          <p><strong>Motivo:</strong> {{ partidaStore.resultadoRodada?.motivoPenalidade ?? 'Resultado sincronizado' }}</p>
          <p v-if="partidaStore.partidaAtual?.status === 'finalizada'"><strong>Partida:</strong> finalizada</p>
        </ion-card-content>
      </ion-card>

      <div class="actions">
        <ion-button expand="block" @click="novaPartida">Nova partida</ion-button>
        <ion-button expand="block" fill="outline" @click="verHistorico">Histórico</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';

const router = useRouter();
const partidaStore = usePartidaStore();

function nomeDoJogador(id?: string) {
  return partidaStore.partidaAtual?.jogadores.find((jogador) => jogador.id === id)?.nome ?? 'Aguardando sincronização';
}

function novaPartida() {
  void partidaStore.sairDaSala().then(() => router.push('/'));
}

function verHistorico() {
  router.push('/historico');
}
</script>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}
</style>
