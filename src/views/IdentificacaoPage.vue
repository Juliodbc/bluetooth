<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Identificação</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Seu nome</ion-label>
          <ion-input v-model="nome" placeholder="Digite seu nome" />
        </ion-item>
      </ion-list>

      <ion-button expand="block" class="ion-margin-top" @click="continuar">
        Continuar
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
} from '@ionic/vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';

const route = useRoute();
const router = useRouter();
const nome = ref('Jogador');
const partidaStore = usePartidaStore();

async function continuar() {
  const nomeLimpo = nome.value.trim() || 'Jogador';
  localStorage.setItem('nomeJogador', nomeLimpo);
  const tipo = String(route.query.tipo ?? 'guest');
  if (tipo === 'host') {
    await partidaStore.criarSala(nomeLimpo);
    router.push('/sala-espera');
    return;
  }

  await partidaStore.buscarSalas();
  router.push('/sala-espera');
}
</script>
