<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/sala-espera" />
        </ion-buttons>
        <ion-title>{{ partida?.nome ?? 'Jogo' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <template v-if="partida && jogadorLocal">
        <div class="status-linha">
          <ion-badge :color="statusConexao === 'conectado' ? 'success' : 'danger'">
            {{ statusConexao === 'conectado' ? 'Bluetooth conectado' : 'Conexão perdida' }}
          </ion-badge>
          <span>Rodada {{ partida.rodadaAtual }}</span>
        </div>

        <section class="mesa">
          <p class="rotulo">{{ jogadorAtual?.id === jogadorLocal.id ? 'Sua vez' : `Vez de ${jogadorAtual?.nome ?? 'aguardando'}` }}</p>
          <h2>{{ jogadorAtual?.nome ?? 'Partida aguardando sincronização' }}</h2>
          <p>{{ partida.jogadores.length }} jogadores · {{ partida.status === 'em_andamento' ? 'em andamento' : partida.status }}</p>
        </section>

        <ion-list>
          <ion-item v-for="jogador in partida.jogadores" :key="jogador.id">
            <ion-label>
              <h2>{{ jogador.nome }}{{ jogador.id === jogadorLocalId ? ' (você)' : '' }}</h2>
              <p>{{ jogador.mao.length }} cartas · {{ jogador.letrasBurro.join('') || 'sem letras' }}</p>
            </ion-label>
            <ion-badge v-if="jogadorAtual?.id === jogador.id" color="primary">vez</ion-badge>
          </ion-item>
        </ion-list>

        <h3>Sua mão</h3>
        <div class="mao">
          <ion-button
            v-for="carta in jogadorLocal.mao"
            :key="carta.id"
            class="carta"
            :fill="cartaSelecionada?.id === carta.id ? 'solid' : 'outline'"
            :disabled="jogadorAtual?.id !== jogadorLocalId || carregando"
            @click="selecionarCarta(carta)"
          >
            <span>{{ carta.valor }}</span>
            <small>{{ carta.naipe }}</small>
          </ion-button>
        </div>

        <ion-text v-if="erro" color="danger"><p>{{ erro }}</p></ion-text>
        <div class="acoes">
          <ion-button expand="block" :disabled="!cartaSelecionada || jogadorAtual?.id !== jogadorLocalId || carregando" @click="passarCarta">
            Passar carta para {{ proximoJogador?.nome ?? 'próximo jogador' }}
          </ion-button>
          <ion-button expand="block" fill="outline" color="warning" :disabled="!podeBater || carregando" @click="bater">
            BATI!
          </ion-button>
        </div>
      </template>
      <ion-text v-else color="medium"><p>Nenhuma partida ativa.</p></ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonButtons,
} from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePartidaStore } from '@/stores/partidaStore';
import type { Carta } from '@/types';

const router = useRouter();
const store = usePartidaStore();
const cartaSelecionada = ref<Carta | null>(null);
const partida = computed(() => store.partidaAtual);
const jogadorLocal = computed(() => store.jogadorLocal);
const jogadorAtual = computed(() => store.jogadorAtual);
const proximoJogador = computed(() => store.proximoJogadorLocal);
const jogadorLocalId = computed(() => store.jogadorLocalId);
const statusConexao = computed(() => store.statusConexao);
const erro = computed(() => store.erro);
const carregando = computed(() => store.carregando);
const podeBater = computed(() => {
  const contagem = new Map<string, number>();
  jogadorLocal.value?.mao.forEach((carta) => contagem.set(carta.valor, (contagem.get(carta.valor) ?? 0) + 1));
  return [...contagem.values()].some((quantidade) => quantidade >= 4);
});

watch(() => partida.value?.status, (status) => {
  if (status === 'finalizada') router.replace('/resultado');
});

function selecionarCarta(carta: Carta) {
  cartaSelecionada.value = cartaSelecionada.value?.id === carta.id ? null : carta;
}

async function passarCarta() {
  if (!cartaSelecionada.value) return;
  const sucesso = await store.passarCarta(cartaSelecionada.value);
  if (sucesso) cartaSelecionada.value = null;
}

async function bater() {
  await store.bater();
}
</script>

<style scoped>
.status-linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--ion-color-medium-shade);
}

.mesa {
  margin: 20px 0;
  padding: 18px 0;
  border-block: 1px solid var(--ion-color-step-150);
}

.mesa h2 {
  margin: 4px 0;
}

.rotulo {
  margin: 0;
  color: var(--ion-color-primary);
}

.mao {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.carta {
  min-width: 72px;
  height: 92px;
  margin: 0;
  --border-radius: 4px;
}

.carta::part(native) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.carta small {
  font-size: 11px;
}

.acoes {
  display: grid;
  gap: 8px;
  margin-top: 20px;
}
</style>