<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot='start'><ion-back-button default-href='/' text='' /></ion-buttons><ion-title>Seu perfil</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen='true'>
      <div class='page-shell identify-shell'>
        <div class='avatar'><ion-icon :icon='personOutline' /></div>
        <p class='eyebrow'>{{ isHost ? 'Nova mesa' : 'Entrar em uma mesa' }}</p>
        <h1 class='page-heading'>Como vamos<br>chamar você?</h1>
        <p class='page-copy'>Esse nome ficará visível para todos os jogadores durante a partida.</p>

        <div class='field-wrap'>
          <ion-label>Nome do jogador</ion-label>
          <ion-input v-model='nome' fill='outline' :maxlength='24' placeholder='Ex.: Vini' enterkeyhint='go' @keyup.enter='continuar' />
          <small>{{ nome.trim().length }}/24 caracteres</small>
        </div>

        <div v-if='partidaStore.erro' class='error-banner'><ion-icon :icon='alertCircleOutline' />{{ partidaStore.erro }}</div>
        <ion-button expand='block' :disabled='!nome.trim() || partidaStore.carregando' @click='continuar'>
          <ion-spinner v-if='partidaStore.carregando' name='crescent' />
          <template v-else>Continuar <ion-icon slot='end' :icon='arrowForwardOutline' /></template>
        </ion-button>
        <p class='privacy'><ion-icon :icon='shieldCheckmarkOutline' /> Seu nome fica salvo apenas neste aparelho.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonLabel, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue';
import { alertCircleOutline, arrowForwardOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';

const route = useRoute();
const router = useRouter();
const nome = ref(localStorage.getItem('nomeJogador') || '');
const partidaStore = usePartidaStore();
const isHost = computed(() => route.query.tipo === 'host');

async function continuar() {
  const nomeLimpo = nome.value.trim();
  if (!nomeLimpo || partidaStore.carregando) return;
  localStorage.setItem('nomeJogador', nomeLimpo);
  if (isHost.value) {
    await partidaStore.criarSala(nomeLimpo);
    if (partidaStore.statusConexao === 'conectado') await router.push('/sala-espera');
    return;
  }
  await partidaStore.buscarSalas();
  await router.push('/sala-espera');
}
</script>

<style scoped>
.identify-shell { display: flex; flex-direction: column; padding-top: clamp(28px, 8vh, 72px); }
.avatar { display: grid; place-items: center; width: 68px; height: 68px; margin-bottom: 26px; border: 1px solid rgba(109, 59, 245, .18); border-radius: 22px; background: rgba(109, 59, 245, .1); color: var(--ion-color-primary); font-size: 2rem; transform: rotate(-3deg); }
.field-wrap { display: grid; gap: 8px; margin: 38px 0 24px; }
.field-wrap ion-label { color: var(--ion-color-dark); font-size: .82rem; font-weight: 800; }
.field-wrap ion-input { --border-color: var(--app-border); --border-radius: 16px; --highlight-color-focused: var(--ion-color-primary); --padding-start: 16px; min-height: 58px; }
.field-wrap small { justify-self: end; color: var(--ion-color-medium); }
.error-banner { margin: 0 0 16px; }
.privacy { display: flex; justify-content: center; align-items: center; gap: 7px; margin: 18px 0 0; color: var(--ion-color-medium); font-size: .72rem; }
.privacy ion-icon { color: var(--ion-color-success); }
</style>
