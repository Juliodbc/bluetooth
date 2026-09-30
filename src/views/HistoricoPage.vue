<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Histórico</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item v-for="partida in partidaStore.historico" :key="partida.id">
          <ion-label>
            <h2>{{ partida.jogadores.join(' · ') || 'Partida sem jogadores' }}</h2>
            <p>{{ new Date(partida.dataInicio).toLocaleString() }}</p>
          </ion-label>
          <ion-badge :color="partida.status === 'finalizada' ? 'success' : 'medium'">
            {{ partida.status }}
          </ion-badge>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { onMounted } from 'vue';
import { usePartidaStore } from '@/stores/partidaStore';

const partidaStore = usePartidaStore();
onMounted(() => partidaStore.carregarHistorico());
</script>
