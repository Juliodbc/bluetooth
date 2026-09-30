<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Burro Bluetooth</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Jogo local sem internet</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          Crie uma partida, conecte convidados e jogue por Bluetooth sem internet.
        </ion-card-content>
      </ion-card>

      <div class="actions">
        <ion-button expand="block" @click="irParaIdentificacao('host')">Criar partida</ion-button>
        <ion-button expand="block" fill="outline" @click="irParaIdentificacao('guest')">Procurar partidas</ion-button>
        <ion-button expand="block" fill="clear" @click="irParaHistorico">Histórico</ion-button>
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

const router = useRouter();

function irParaIdentificacao(tipo: 'host' | 'guest') {
  router.push({ path: '/identificacao', query: { tipo } });
}

function irParaHistorico() {
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
