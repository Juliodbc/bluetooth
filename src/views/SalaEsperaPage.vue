<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Sala de espera</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ partidaStore.anfitriao ? 'Jogadores conectados' : 'Partidas encontradas' }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list v-if="partidaStore.anfitriao">
            <ion-item v-for="jogador in partidaStore.partidaAtual?.jogadores ?? []" :key="jogador.id">
              <ion-label>{{ jogador.nome }}</ion-label>
              <ion-badge :color="jogador.conectado ? 'success' : 'medium'">
                {{ jogador.conectado ? 'online' : 'offline' }}
              </ion-badge>
            </ion-item>
          </ion-list>
          <ion-list v-else>
            <ion-item v-for="sala in partidaStore.salasDisponiveis" :key="sala.id" button @click="conectar(sala)">
              <ion-label>
                <h2>{{ sala.nome }}</h2>
                <p>{{ sala.jogadoresConectados }} jogadores · sinal {{ sala.sinal ?? '?' }}</p>
              </ion-label>
              <ion-button slot="end" size="small">Entrar</ion-button>
            </ion-item>
            <ion-item v-if="!partidaStore.carregando && partidaStore.salasDisponiveis.length === 0">
              <ion-label>Nenhuma partida encontrada. Faça uma nova busca.</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-text v-if="partidaStore.erro" color="danger"><p>{{ partidaStore.erro }}</p></ion-text>
      <ion-button v-if="partidaStore.anfitriao" expand="block" class="ion-margin-top" :disabled="(partidaStore.partidaAtual?.jogadores.length ?? 0) < 2 || partidaStore.carregando" @click="iniciarPartida">
        Iniciar partida
      </ion-button>
      <ion-button v-else expand="block" fill="outline" class="ion-margin-top" :disabled="partidaStore.carregando" @click="buscarNovamente">
        Buscar novamente
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonText,
  IonToolbar,
  IonButtons,
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';
import type { PartidaDescoberta } from '@/transport/TransporteBluetooth';

const router = useRouter();
const partidaStore = usePartidaStore();

function iniciarPartida() {
  void partidaStore.iniciarPartida().then((iniciada) => {
    if (iniciada) router.push('/jogo');
  });
}

async function conectar(sala: PartidaDescoberta) {
  const nomeJogador = localStorage.getItem('nomeJogador') || 'Jogador';
  await partidaStore.entrarNaSala(sala, nomeJogador);
  if (partidaStore.statusConexao === 'conectado' && partidaStore.partidaAtual) {
    router.push('/jogo');
  }
}

function buscarNovamente() {
  void partidaStore.buscarSalas();
}
</script>
